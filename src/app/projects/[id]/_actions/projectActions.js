'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';
import { VALID_TRANSITIONS } from '@/utils/statusPipeline';

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
  const nextOptions = VALID_TRANSITIONS[current] ?? [];
  if (!nextOptions.length) return { error: 'No valid next status.' };

  const next = nextOptions[0];
  await query(
    'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
    [next, projectId],
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
