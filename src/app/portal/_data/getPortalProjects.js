import { query } from '@/db/index';

/**
 * Fetch all projects belonging to a verified client.
 * clientName is stamped from the Clerk session — never trust a URL param alone.
 * Pricing, rate, margin, and internal-notes columns are never selected.
 */
export async function getPortalProjects(clientName) {
  const { rows } = await query(
    `SELECT id, code, facility_name, facility_address, status, created_at
       FROM projects
      WHERE client_name = $1
      ORDER BY created_at DESC`,
    [clientName],
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
