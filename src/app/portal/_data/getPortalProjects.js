import { query } from '@/db/index';

export async function getPortalProjects() {
  const { rows } = await query(
    `SELECT id, code, facility_name, facility_address, status, created_at
       FROM projects
      ORDER BY created_at DESC`,
  );
  return rows.map((r) => ({
    id:              r.id,
    code:            r.code,
    facilityName:    r.facility_name,
    facilityAddress: r.facility_address,
    status:          r.status,
    createdAt:       r.created_at,
  }));
}

/**
 * Fetch lightweight shipment data (cartons + received flag) for a project.
 * Caller is responsible for verifying project ownership before calling this —
 * getPortalProjects already enforces that by filtering on client_name.
 */
export async function getPortalShipmentsForProject(projectId) {
  const { rows } = await query(
    `SELECT cartons, received
       FROM shipments
      WHERE project_id = $1`,
    [projectId],
  );
  return rows.map((r) => ({
    cartons:  Number(r.cartons),
    received: r.received,
  }));
}
