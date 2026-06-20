'use server';

import { revalidatePath } from 'next/cache';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { query } from '@/db/index';
import { VALID_TRANSITIONS } from '@/utils/statusPipeline';
import { toPipelineStatus, DB_TO_PIPELINE } from '@/app/portal/_components/statusConfig.js';
import {
  getProjectById,
  getShipmentsByProjectId,
  getInstallTasksByProjectId,
} from '../_data/getProject';
import { computePricingWithRates, buildFullQuoteBreakdown } from '@/utils/quote';
import { rowToRateCard } from '@/app/rate-card/_lib/rateCardFields';

/** True when the caller is an authenticated admin. */
async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.role === 'admin';
}

/**
 * Recompute the quote breakdown for a project against a chosen rate card.
 * Pricing is always derived server-side so the client cannot spoof totals — the
 * quoteBreakdown sent from the browser is only a preview and is never trusted.
 * Returns { breakdown, rates, status } or { error }.
 */
async function recomputeWithRateCard(projectId, rateCardId) {
  if (!rateCardId) return { error: 'A rate card must be selected.' };

  const [project, shipments, installTasks, cardRes] = await Promise.all([
    getProjectById(projectId),
    getShipmentsByProjectId(projectId),
    getInstallTasksByProjectId(projectId),
    query('SELECT * FROM rate_cards WHERE id = $1', [rateCardId]),
  ]);
  if (!project) return { error: 'Project not found.' };
  if (!cardRes.rows.length) return { error: 'Selected rate card not found.' };

  const { rates } = rowToRateCard(cardRes.rows[0]);
  const pricing = computePricingWithRates(project, shipments, installTasks, rates);
  if (!pricing) return { error: 'Cannot send quote — rate card is incomplete.' };

  return {
    breakdown: buildFullQuoteBreakdown(pricing, rates, project),
    rates,
    status: project.status,
  };
}

/** Persist a quote: snapshot the rate card onto projects.rates (with its id) and
 *  the itemized breakdown onto projects.quoted_price, advancing to 'quoted'. */
async function persistQuote(projectId, rateCardId, rates, breakdown) {
  const ratesSnapshot = { ...rates, rateCardId };
  await query(
    `UPDATE projects
        SET status = 'quoted', rates = $1, quoted_price = $2, updated_at = NOW()
      WHERE id = $3`,
    [JSON.stringify(ratesSnapshot), JSON.stringify(breakdown), projectId],
  );
  revalidatePath('/projects');
  revalidatePath('/portal');
  revalidatePath(`/projects/${projectId}`);
}

/**
 * Send a quote to the client: prospect -> quoted.
 * Snapshots the chosen rate card + itemized breakdown onto the project.
 */
export async function sendQuote(projectId, rateCardId, _quoteBreakdown) {
  if (!(await isAdmin())) return { error: 'Unauthorized. Admin role required.' };

  const result = await recomputeWithRateCard(projectId, rateCardId);
  if (result.error) return result;
  if (result.status !== 'prospect') {
    return { error: 'Quote can only be sent from the prospect stage.' };
  }

  await persistQuote(projectId, rateCardId, result.rates, result.breakdown);
  return { ok: true };
}

/**
 * Re-send a quote with a (possibly new) rate card. Used by the "Revise & Resend"
 * button after a denial (denied -> quoted). Always refreshes quoted_price.
 */
export async function resendQuote(projectId, rateCardId, _quoteBreakdown) {
  if (!(await isAdmin())) return { error: 'Unauthorized. Admin role required.' };

  const result = await recomputeWithRateCard(projectId, rateCardId);
  if (result.error) return result;
  if (result.status !== 'quoted' && result.status !== 'denied') {
    return { error: 'Quote can only be resent from the quoted or denied stage.' };
  }

  await persistQuote(projectId, rateCardId, result.rates, result.breakdown);
  return { ok: true };
}

// Reverse of DB_TO_PIPELINE (pipeline label -> raw DB value). The first DB value
// wins for labels that share one (e.g. "Complete" -> "complete", not "invoiced").
const PIPELINE_TO_DB = Object.entries(DB_TO_PIPELINE).reduce((acc, [dbValue, label]) => {
  if (!(label in acc)) acc[label] = dbValue;
  return acc;
}, {});

/**
 * Advance a project to the next valid pipeline status.
 * Reads current status from DB so the client cannot spoof it.
 */
export async function advanceStatus(projectId) {
  const { rows } = await query(
    'SELECT status FROM projects WHERE id = $1',
    [projectId],
  );
  if (!rows.length) return { error: 'Project not found.' };

  const current = rows[0].status;
  // VALID_TRANSITIONS is keyed by pipeline labels; project.status is a raw DB
  // value, so normalize it before the lookup or no transition is ever found.
  const nextOptions = VALID_TRANSITIONS[toPipelineStatus(current)] ?? [];
  if (!nextOptions.length) return { error: 'No valid next status.' };

  const next = nextOptions[0];
  // VALID_TRANSITIONS yields a pipeline label, but the DB stores raw values, so
  // convert back before writing. Fall back to the label if no mapping exists.
  const nextDbValue = PIPELINE_TO_DB[next] ?? next;
  await query(
    'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
    [nextDbValue, projectId],
  );
  revalidatePath(`/projects/${projectId}`);
  return { status: next };
}

/**
 * Toggle the received flag on a shipment.
 */
export async function markShipmentReceived(shipmentId, received, projectId) {
  await query(
    'UPDATE shipments SET received = $1 WHERE id = $2',
    [received, shipmentId],
  );
  revalidatePath(`/projects/${projectId}`);
}

/**
 * Toggle the completed flag on an install task.
 */
export async function toggleInstallTask(taskId, completed, projectId) {
  await query(
    'UPDATE install_tasks SET completed = $1 WHERE id = $2',
    [completed, taskId],
  );
  revalidatePath(`/projects/${projectId}`);
}
