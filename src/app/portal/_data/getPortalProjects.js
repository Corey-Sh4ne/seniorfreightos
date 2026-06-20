import { query } from '@/db/index';

// Statuses that represent an active/awarded project (shown under "Your Projects").
// Quotes (quoted/denied) live in their own section; prospect is admin-internal and
// never surfaced to the client portal at all.
const ACTIVE_STATUSES = [
  'awarded', 'receiving', 'staging', 'scheduled',
  'delivered', 'installing', 'complete', 'invoiced',
];

/**
 * Fetch active portal projects (everything past the quote stage).
 * Excludes prospect / quoted / denied — those are not "Your Projects".
 *
 * Pass a clientName to scope results to a single client (client_user view).
 * Omit it (or pass a falsy value) to return every project (admin view).
 */
export async function getPortalProjects(clientName) {
  const { rows } = clientName
    ? await query(
        `SELECT id, code, facility_name, facility_address, status, created_at
           FROM projects
          WHERE client_name = $1 AND status = ANY($2)
          ORDER BY created_at DESC`,
        [clientName, ACTIVE_STATUSES],
      )
    : await query(
        `SELECT id, code, facility_name, facility_address, status, created_at
           FROM projects
          WHERE status = ANY($1)
          ORDER BY created_at DESC`,
        [ACTIVE_STATUSES],
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
 * Fetch pending quotes for the portal — projects awaiting a client response
 * (status 'quoted') or that the client denied (status 'denied'). The total is
 * read from the snapshotted quoted_price breakdown.
 *
 * Pass a clientName to scope to a single client; omit for the admin view.
 */
export async function getPortalQuotes(clientName) {
  const { rows } = clientName
    ? await query(
        `SELECT id, code, facility_name, facility_address, status,
                quoted_price, updated_at
           FROM projects
          WHERE client_name = $1 AND status IN ('quoted', 'denied')
          ORDER BY updated_at DESC`,
        [clientName],
      )
    : await query(
        `SELECT id, code, facility_name, facility_address, status,
                quoted_price, updated_at
           FROM projects
          WHERE status IN ('quoted', 'denied')
          ORDER BY updated_at DESC`,
      );
  return rows.map((r) => ({
    id:              r.id,
    code:            r.code,
    facilityName:    r.facility_name,
    facilityAddress: r.facility_address,
    status:          r.status,
    total:           r.quoted_price?.total ?? null,
    updatedAt:       r.updated_at,
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
