'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';
import { requireOpsRole } from '../_lib/auth';
import { logActivity } from '@/utils/activityLogger';

const DENIED = { error: 'You do not have permission to perform this action.' };

/** Revalidate both the ops board and the client portal so each reflects changes. */
function revalidateBoards() {
  revalidatePath('/ops');
  revalidatePath('/portal');
}

/** Current raw DB status for a project, or null if it does not exist. */
async function getStatus(projectId) {
  const { rows } = await query('SELECT status FROM projects WHERE id = $1', [projectId]);
  return rows.length ? rows[0].status : null;
}

async function setStatus(projectId, status) {
  await query(
    'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, projectId],
  );
}

/**
 * Move a project from `expected` to `next`, enforcing the current stage so a
 * transition can never fire out of order or be replayed. `expected` may be a
 * single status or a list of acceptable statuses. When `shipments` / `tasks` is
 * a boolean, every shipment / install task is set to that value — used to lock a
 * checklist on confirm (true) or reopen it on reset (false).
 *
 * When both `noteKey` and a non-empty `note` are provided, the note is merged
 * into the project's stage_notes JSONB column and a follow-up activity_log
 * entry is written. Returns a standard action result.
 */
async function transitionStage(
  projectId,
  expected,
  next,
  { shipments, tasks, logAction, noteKey, note } = {},
) {
  const access = await requireOpsRole();
  if (!access.ok) return DENIED;

  const allowed = Array.isArray(expected) ? expected : [expected];
  const current = await getStatus(projectId);
  if (!allowed.includes(current)) {
    return { error: `Project must be in '${allowed.join("' or '")}' to perform this action.` };
  }

  if (typeof shipments === 'boolean') {
    await query('UPDATE shipments SET received = $1 WHERE project_id = $2', [shipments, projectId]);
  }
  if (typeof tasks === 'boolean') {
    await query('UPDATE install_tasks SET completed = $1 WHERE project_id = $2', [tasks, projectId]);
  }

  await setStatus(projectId, next);

  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (noteKey && trimmedNote) {
    await query(
      'UPDATE projects SET stage_notes = stage_notes || $1::jsonb WHERE id = $2',
      [JSON.stringify({ [noteKey]: trimmedNote }), projectId],
    );
  }

  if (logAction) {
    await logActivity(projectId, access.actor.name, access.actor.role, logAction, null);
  }
  if (noteKey && trimmedNote) {
    await logActivity(
      projectId,
      access.actor.name,
      access.actor.role,
      `Note added at ${noteKey}`,
      trimmedNote,
    );
  }

  revalidateBoards();
  return { ok: true, status: next };
}

/* -------------------------------------------------------------------------- */
/* Free-toggle phase (receiving shipments, installing tasks)                  */
/* -------------------------------------------------------------------------- */

/**
 * Toggle a single shipment's received flag. Only permitted while the project is
 * in 'receiving'; once receiving is confirmed the shipments lock.
 */
export async function markShipmentReceived(shipmentId, projectId, received) {
  const access = await requireOpsRole();
  if (!access.ok) return DENIED;

  if ((await getStatus(projectId)) !== 'receiving') {
    return { error: 'Shipments can only be changed while the project is receiving.' };
  }

  await query(
    'UPDATE shipments SET received = $1 WHERE id = $2 AND project_id = $3',
    [Boolean(received), shipmentId, projectId],
  );

  revalidateBoards();
  return { ok: true };
}

/**
 * Toggle a single install task's completed flag. Only permitted while the
 * project is 'installing'; once installation is confirmed the tasks lock.
 */
export async function markInstallTaskComplete(taskId, projectId, completed) {
  const access = await requireOpsRole();
  if (!access.ok) return DENIED;

  if ((await getStatus(projectId)) !== 'installing') {
    return { error: 'Install tasks can only be changed while the project is installing.' };
  }

  await query(
    'UPDATE install_tasks SET completed = $1 WHERE id = $2 AND project_id = $3',
    [Boolean(completed), taskId, projectId],
  );

  revalidateBoards();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Stage confirmations (forward) — each reversible via its per-stage reset     */
/* -------------------------------------------------------------------------- */

/** Begin the receiving workflow: advance 'awarded' -> 'receiving'. */
export async function confirmStartReceiving(projectId) {
  return transitionStage(projectId, 'awarded', 'receiving', {
    logAction: 'Receiving started',
  });
}

/**
 * Confirm all shipments received: mark every shipment received and advance
 * 'receiving' -> 'staging' (Consolidating).
 */
export async function confirmReceiving(projectId, note) {
  return transitionStage(projectId, 'receiving', 'staging', {
    shipments: true,
    logAction: 'All shipments confirmed received',
    noteKey: 'receiving',
    note,
  });
}

/** Confirm freight consolidated: advance 'staging' -> 'scheduled' (Out for Delivery). */
export async function confirmConsolidated(projectId, note) {
  return transitionStage(projectId, 'staging', 'scheduled', {
    logAction: 'Freight consolidated and ready',
    noteKey: 'consolidating',
    note,
  });
}

/** Confirm the truck has departed: advance 'scheduled' -> 'delivered'. */
export async function confirmDeparted(projectId, note) {
  return transitionStage(projectId, 'scheduled', 'delivered', {
    logAction: 'Truck departed for delivery',
    noteKey: 'departed',
    note,
  });
}

/** Confirm delivery at the facility: advance 'delivered' -> 'installing'. */
export async function confirmDelivered(projectId, note) {
  return transitionStage(projectId, 'delivered', 'installing', {
    logAction: 'Delivery confirmed at facility',
    noteKey: 'delivered',
    note,
  });
}

/**
 * Confirm installation complete: mark every install task complete and advance
 * 'installing' -> 'complete'.
 */
export async function confirmInstallComplete(projectId, note) {
  return transitionStage(projectId, 'installing', 'complete', {
    tasks: true,
    logAction: 'Installation complete',
    noteKey: 'installing',
    note,
  });
}

/* -------------------------------------------------------------------------- */
/* Per-stage resets (step a project back to the start of the previous stage)   */
/* -------------------------------------------------------------------------- */

/** Step back 'staging' -> 'receiving' and reopen the shipments checklist. */
export async function resetToReceiving(projectId) {
  return transitionStage(projectId, 'staging', 'receiving', { shipments: false });
}

/** Step back 'scheduled' -> 'staging' (Consolidating). */
export async function resetToStaging(projectId) {
  return transitionStage(projectId, 'scheduled', 'staging');
}

/** Step back 'delivered' -> 'scheduled' (Out for Delivery). */
export async function resetToScheduled(projectId) {
  return transitionStage(projectId, 'delivered', 'scheduled');
}

/** Step back 'installing' -> 'delivered' and reopen the install-task checklist. */
export async function resetToDelivered(projectId) {
  return transitionStage(projectId, 'installing', 'delivered', { tasks: false });
}

/** Step back 'complete'/'invoiced' -> 'installing' and reopen the install-task checklist. */
export async function resetToInstalling(projectId) {
  return transitionStage(projectId, ['complete', 'invoiced'], 'installing', { tasks: false });
}

/**
 * Full reset: clear all shipment + task progress, wipe the quote and invoice
 * data, and return the project to 'prospect' so the entire demo flow can be
 * walked again from the very beginning.
 */
export async function resetProject(projectId) {
  const access = await requireOpsRole();
  if (!access.ok) return DENIED;

  await query('UPDATE shipments SET received = FALSE WHERE project_id = $1', [projectId]);
  await query('UPDATE install_tasks SET completed = FALSE WHERE project_id = $1', [projectId]);
  await query(
    `UPDATE projects
        SET status = 'prospect',
            quoted_price = NULL,
            invoice_number = NULL,
            invoice_generated_at = NULL,
            invoice_status = NULL,
            accepted_at = NULL,
            stage_notes = '{}'::jsonb,
            updated_at = NOW()
      WHERE id = $1`,
    [projectId],
  );

  await logActivity(projectId, access.actor.name, access.actor.role, 'Project reset for demo', null);

  revalidateBoards();
  return { ok: true, status: 'prospect' };
}
