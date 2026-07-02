import { query } from '@/db/index';

/**
 * Fetch a single project by ID.
 * Pricing, rate, margin, and notes columns are never selected.
 *
 * Pass a clientName to scope the lookup to a single client (client_user view);
 * a project owned by another client will not be returned. Omit it for the admin
 * view, which can read any project by id.
 */
export async function getPortalProjectById(id, clientName) {
  // quoted_price holds the client-facing itemized quote (no internal rates,
  // margin, or overhead), so it is safe to expose in the portal. accepted_at is
  // a simple timestamp.
  const { rows } = clientName
    ? await query(
        `SELECT id, code, client_name, facility_name, facility_address,
                contact_name, contact_email, status,
                storage_days, rush_delivery, created_at,
                quoted_price, accepted_at, stage_notes
           FROM projects
          WHERE id = $1 AND client_name = $2`,
        [id, clientName],
      )
    : await query(
        `SELECT id, code, client_name, facility_name, facility_address,
                contact_name, contact_email, status,
                storage_days, rush_delivery, created_at,
                quoted_price, accepted_at, stage_notes
           FROM projects
          WHERE id = $1`,
        [id],
      );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id:              r.id,
    code:            r.code,
    clientName:      r.client_name,
    facilityName:    r.facility_name,
    facilityAddress: r.facility_address,
    contactName:     r.contact_name,
    contactEmail:    r.contact_email,
    status:          r.status,
    storageDays:     Number(r.storage_days),
    rushDelivery:    r.rush_delivery,
    createdAt:       r.created_at,
    quotedPrice:     r.quoted_price ?? null,
    acceptedAt:      r.accepted_at ?? null,
    stageNotes:      r.stage_notes ?? {},
  };
}

/**
 * Fetch all shipments for a portal project.
 * Caller must verify project ownership via getPortalProjectById before calling.
 */
export async function getPortalProjectShipments(projectId) {
  const { rows } = await query(
    `SELECT id, vendor, category, description, qty, cartons, eta, received
       FROM shipments
      WHERE project_id = $1
      ORDER BY eta ASC NULLS LAST, vendor ASC`,
    [projectId],
  );
  return rows.map((r) => ({
    id:          r.id,
    vendor:      r.vendor,
    category:    r.category,
    description: r.description,
    qty:         Number(r.qty),
    cartons:     Number(r.cartons),
    eta:         r.eta ? r.eta.toISOString().slice(0, 10) : null,
    received:    r.received,
  }));
}

/**
 * Fetch all install tasks for a portal project.
 * Caller must verify project ownership via getPortalProjectById before calling.
 * The completed flag is included; qty counts are safe for progress display.
 */
export async function getPortalProjectInstallTasks(projectId) {
  const { rows } = await query(
    `SELECT id, type, qty, completed
       FROM install_tasks
      WHERE project_id = $1
      ORDER BY type ASC`,
    [projectId],
  );
  return rows.map((r) => ({
    id:        r.id,
    type:      r.type,
    qty:       Number(r.qty),
    completed: r.completed,
  }));
}
