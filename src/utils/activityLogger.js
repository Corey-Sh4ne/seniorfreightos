import { query } from '@/db/index';

/**
 * Append a row to activity_log. Never throws — a failed audit write should not
 * break the user-facing action that triggered it. Errors are logged silently.
 *
 * @param {string} projectId
 * @param {string} actorName
 * @param {string} actorRole
 * @param {string} action
 * @param {string|null} [detail]
 */
export async function logActivity(projectId, actorName, actorRole, action, detail = null) {
  try {
    await query(
      `INSERT INTO activity_log
         (project_id, actor_name, actor_role, action, detail)
       VALUES ($1, $2, $3, $4, $5)`,
      [projectId, actorName, actorRole, action, detail],
    );
  } catch (err) {
    console.error('logActivity failed', err);
  }
}
