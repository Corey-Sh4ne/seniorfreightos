'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';
import { VALID_TRANSITIONS } from '@/utils/statusPipeline';
import { toPipelineStatus, DB_TO_PIPELINE } from '@/app/portal/_components/statusConfig.js';

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
