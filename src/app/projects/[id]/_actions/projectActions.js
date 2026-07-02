'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
import { logActivity } from '@/utils/activityLogger';

/**
 * Admin gate that also returns the acting user's display name + role so callers
 * can attribute activity_log entries without re-fetching from Clerk.
 * Returns { error } on failure, { actor: { name, role } } on success.
 */
async function getAdminActor() {
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized. Admin role required.' };
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role;
  if (role !== 'admin') return { error: 'Unauthorized. Admin role required.' };
  const first = user.firstName ?? '';
  const last = user.lastName ?? '';
  const full = `${first} ${last}`.trim();
  const name = full || user.emailAddresses?.[0]?.emailAddress || 'Unknown';
  return { actor: { name, role } };
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
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const result = await recomputeWithRateCard(projectId, rateCardId);
  if (result.error) return result;
  if (result.status !== 'prospect') {
    return { error: 'Quote can only be sent from the prospect stage.' };
  }

  await persistQuote(projectId, rateCardId, result.rates, result.breakdown);
  await logActivity(projectId, gate.actor.name, gate.actor.role, 'Quote sent to client', null);
  return { ok: true };
}

/**
 * Re-send a quote with a (possibly new) rate card. Used by the "Revise & Resend"
 * button after a denial (denied -> quoted). Always refreshes quoted_price.
 */
export async function resendQuote(projectId, rateCardId, _quoteBreakdown) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const result = await recomputeWithRateCard(projectId, rateCardId);
  if (result.error) return result;
  if (result.status !== 'quoted' && result.status !== 'denied') {
    return { error: 'Quote can only be resent from the quoted or denied stage.' };
  }

  await persistQuote(projectId, rateCardId, result.rates, result.breakdown);
  await logActivity(projectId, gate.actor.name, gate.actor.role, 'Quote revised and resent', null);
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
 * Update editable project fields (facility, contact, distance/storage/rush, notes).
 * client_name, code, and status are intentionally NOT editable here. Admin only.
 */
export async function updateProject(projectId, formData) {
  const gate = await getAdminActor();
  if (gate.error) return gate;
  if (!projectId) return { error: 'Missing project id.' };

  const facilityName    = String(formData.get('facility_name')    ?? '').trim();
  const facilityAddress = String(formData.get('facility_address') ?? '').trim();
  const contactName     = String(formData.get('contact_name')     ?? '').trim();
  const contactEmail    = String(formData.get('contact_email')    ?? '').trim();
  const milesFromHub    = parseFloat(formData.get('miles_from_hub') ?? '0') || 0;
  const storageDays     = parseInt(formData.get('storage_days')  ?? '0', 10) || 0;
  const rushDelivery    = formData.get('rush_delivery') === 'on';
  const notes           = String(formData.get('notes') ?? '');

  if (!facilityName) return { error: 'Facility name is required.' };
  if (milesFromHub < 0) return { error: 'Miles from hub cannot be negative.' };
  if (storageDays < 0)  return { error: 'Storage days cannot be negative.' };

  const { rowCount } = await query(
    `UPDATE projects
        SET facility_name = $1, facility_address = $2,
            contact_name = $3, contact_email = $4,
            miles_from_hub = $5, storage_days = $6,
            rush_delivery = $7, notes = $8, updated_at = NOW()
      WHERE id = $9`,
    [facilityName, facilityAddress, contactName, contactEmail,
     milesFromHub, storageDays, rushDelivery, notes, projectId],
  );
  if (!rowCount) return { error: 'Project not found.' };

  await logActivity(projectId, gate.actor.name, gate.actor.role, 'Project details updated', null);
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

/**
 * Permanently delete a project. Shipments and install_tasks rows are removed
 * automatically via ON DELETE CASCADE on their project_id FKs. Admin only.
 * Redirects to /projects on success.
 *
 * Log BEFORE the delete because activity_log.project_id cascades on delete too —
 * a post-delete row would be immediately removed.
 */
export async function deleteProject(projectId) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const { rows } = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (!rows.length) return { error: 'Project not found.' };

  await logActivity(projectId, gate.actor.name, gate.actor.role, 'Project deleted', null);
  await query('DELETE FROM projects WHERE id = $1', [projectId]);

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  redirect('/projects');
}

const SHIPMENT_CATEGORIES = [
  'Casegoods', 'Seating', 'Mattresses & Bedding', 'Window Treatments',
  'Art & Decor', 'Lighting', 'Signage', 'Appliances', 'Flooring',
  'Outdoor Furniture', 'Fitness Equipment',
];

const INSTALL_TASK_TYPES = [
  'assemble', 'hang_art', 'mount_tv', 'place', 'debris', 'window_treat',
];

/**
 * Insert a new shipment row on a project. Admin only.
 */
export async function addShipment(projectId, formData) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const vendor      = String(formData.get('vendor')      ?? '').trim();
  const category    = String(formData.get('category')    ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const qty         = parseInt(formData.get('qty') ?? '0', 10) || 0;
  const weightPerUnitLbs = parseFloat(formData.get('weight_per_unit_lbs') ?? '0') || 0;
  const cartons     = parseInt(formData.get('cartons') ?? '0', 10) || 0;
  const etaRaw      = String(formData.get('eta') ?? '').trim();
  const eta         = etaRaw || null;

  if (!vendor)                              return { error: 'Vendor is required.' };
  if (!SHIPMENT_CATEGORIES.includes(category)) return { error: 'Invalid category.' };
  if (!description)                         return { error: 'Description is required.' };
  if (qty < 1)                              return { error: 'Qty must be at least 1.' };
  if (weightPerUnitLbs < 0)                 return { error: 'Weight cannot be negative.' };

  await query(
    `INSERT INTO shipments
       (project_id, vendor, category, description, qty, weight_per_unit_lbs, cartons, eta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [projectId, vendor, category, description, qty, weightPerUnitLbs, cartons, eta],
  );

  await logActivity(
    projectId, gate.actor.name, gate.actor.role,
    `Shipment added: ${vendor} - ${description}`, null,
  );
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/ops');
  return { ok: true };
}

/**
 * Insert a new install task row on a project. Admin only.
 */
export async function addInstallTask(projectId, formData) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const type  = String(formData.get('type')  ?? '').trim();
  const qty   = parseInt(formData.get('qty') ?? '0', 10) || 0;
  const notes = String(formData.get('notes') ?? '').trim();

  if (!INSTALL_TASK_TYPES.includes(type)) return { error: 'Invalid task type.' };
  if (qty < 1)                            return { error: 'Qty must be at least 1.' };

  await query(
    `INSERT INTO install_tasks (project_id, type, qty, notes)
     VALUES ($1, $2, $3, $4)`,
    [projectId, type, qty, notes],
  );

  await logActivity(
    projectId, gate.actor.name, gate.actor.role,
    `Install task added: ${type}`, null,
  );
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/ops');
  return { ok: true };
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
 * Update the editable fields on a shipment. Admin only.
 */
export async function updateShipment(shipmentId, projectId, formData) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const vendor      = String(formData.get('vendor')      ?? '').trim();
  const category    = String(formData.get('category')    ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const qty         = parseInt(formData.get('qty') ?? '0', 10) || 0;
  const weightPerUnitLbs = parseFloat(formData.get('weight_per_unit_lbs') ?? '0') || 0;
  const cartons     = parseInt(formData.get('cartons') ?? '0', 10) || 0;
  const etaRaw      = String(formData.get('eta') ?? '').trim();
  const eta         = etaRaw || null;

  if (!vendor)                              return { error: 'Vendor is required.' };
  if (!SHIPMENT_CATEGORIES.includes(category)) return { error: 'Invalid category.' };
  if (!description)                         return { error: 'Description is required.' };
  if (qty < 1)                              return { error: 'Qty must be at least 1.' };
  if (weightPerUnitLbs < 0)                 return { error: 'Weight cannot be negative.' };

  const { rowCount } = await query(
    `UPDATE shipments
        SET vendor = $1, category = $2, description = $3,
            qty = $4, weight_per_unit_lbs = $5, cartons = $6, eta = $7
      WHERE id = $8`,
    [vendor, category, description, qty, weightPerUnitLbs, cartons, eta, shipmentId],
  );
  if (!rowCount) return { error: 'Shipment not found.' };

  await logActivity(
    projectId, gate.actor.name, gate.actor.role,
    `Shipment updated: ${vendor}`, null,
  );
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/ops');
  return { ok: true };
}

/**
 * Permanently delete a shipment. Admin only.
 */
export async function deleteShipment(shipmentId, projectId) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const { rows } = await query(
    'SELECT vendor FROM shipments WHERE id = $1',
    [shipmentId],
  );
  if (!rows.length) return { error: 'Shipment not found.' };
  const vendor = rows[0].vendor;

  await query('DELETE FROM shipments WHERE id = $1', [shipmentId]);

  await logActivity(
    projectId, gate.actor.name, gate.actor.role,
    `Shipment deleted: ${vendor}`, null,
  );
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/ops');
  return { ok: true };
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

/**
 * Update the editable fields on an install task. Admin only.
 */
export async function updateInstallTask(taskId, projectId, formData) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const type  = String(formData.get('type')  ?? '').trim();
  const qty   = parseInt(formData.get('qty') ?? '0', 10) || 0;
  const notes = String(formData.get('notes') ?? '').trim();

  if (!INSTALL_TASK_TYPES.includes(type)) return { error: 'Invalid task type.' };
  if (qty < 1)                            return { error: 'Qty must be at least 1.' };

  const { rowCount } = await query(
    `UPDATE install_tasks
        SET type = $1, qty = $2, notes = $3
      WHERE id = $4`,
    [type, qty, notes, taskId],
  );
  if (!rowCount) return { error: 'Install task not found.' };

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/ops');
  return { ok: true };
}

/**
 * Permanently delete an install task. Admin only.
 */
export async function deleteInstallTask(taskId, projectId) {
  const gate = await getAdminActor();
  if (gate.error) return gate;

  const { rowCount } = await query(
    'DELETE FROM install_tasks WHERE id = $1',
    [taskId],
  );
  if (!rowCount) return { error: 'Install task not found.' };

  await logActivity(
    projectId, gate.actor.name, gate.actor.role,
    'Install task deleted', null,
  );
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/ops');
  return { ok: true };
}
