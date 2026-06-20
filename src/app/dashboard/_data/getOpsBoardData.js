import { query } from '@/db/index';

/**
 * Fetch every project with its shipments and install tasks, shaped to match
 * what the ops board's <OpsClient /> expects. Mirrors the data layer of the
 * ops page so the admin "View as Dispatcher" preview renders identically
 * without importing from the ops route directly.
 */
export async function getOpsBoardData() {
  const { rows: projects } = await query(
    `SELECT id, code, client_name, facility_name, status
       FROM projects
   ORDER BY created_at DESC`,
  );

  const projectIds = projects.map((p) => p.id);

  let shipments = [];
  let tasks = [];
  if (projectIds.length) {
    ({ rows: shipments } = await query(
      `SELECT id, project_id, vendor, category, qty, received
         FROM shipments
        WHERE project_id = ANY($1)
     ORDER BY vendor`,
      [projectIds],
    ));
    ({ rows: tasks } = await query(
      `SELECT id, project_id, type, qty, completed
         FROM install_tasks
        WHERE project_id = ANY($1)
     ORDER BY type`,
      [projectIds],
    ));
  }

  return projects.map((p) => ({
    id: p.id,
    code: p.code,
    clientName: p.client_name,
    facilityName: p.facility_name,
    status: p.status,
    shipments: shipments
      .filter((s) => s.project_id === p.id)
      .map((s) => ({
        id: s.id,
        vendor: s.vendor,
        category: s.category,
        qty: Number(s.qty),
        received: s.received,
      })),
    installTasks: tasks
      .filter((t) => t.project_id === p.id)
      .map((t) => ({
        id: t.id,
        type: t.type,
        qty: Number(t.qty),
        completed: t.completed,
      })),
  }));
}
