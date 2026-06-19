import { query } from '@/db/index';

/**
 * Fetch a single project by UUID.
 * Returns null if not found.
 */
export async function getProjectById(id) {
  const { rows } = await query(
    `SELECT id, code, client_name, facility_name, facility_address,
            contact_name, contact_email, miles_from_hub, status,
            storage_days, rush_delivery, rates, notes, created_at
     FROM projects WHERE id = $1`,
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
    milesFromHub:    Number(r.miles_from_hub),
    status:          r.status,
    storageDays:     Number(r.storage_days),
    rushDelivery:    r.rush_delivery,
    rates:           r.rates ?? {},
    notes:           r.notes ?? '',
    createdAt:       r.created_at,
  };
}

/**
 * Fetch all shipments for a project, ordered by vendor.
 */
export async function getShipmentsByProjectId(projectId) {
  const { rows } = await query(
    `SELECT id, vendor, category, description, qty,
            weight_per_unit_lbs, cartons, eta, received
     FROM shipments WHERE project_id = $1 ORDER BY vendor`,
    [projectId],
  );
  return rows.map((r) => ({
    id:               r.id,
    vendor:           r.vendor,
    category:         r.category,
    description:      r.description,
    qty:              Number(r.qty),
    weightPerUnitLbs: Number(r.weight_per_unit_lbs),
    cartons:          Number(r.cartons),
    eta:              r.eta ? r.eta.toISOString().slice(0, 10) : null,
    received:         r.received,
  }));
}

/**
 * Fetch all install tasks for a project, ordered by type.
 */
export async function getInstallTasksByProjectId(projectId) {
  const { rows } = await query(
    `SELECT id, type, qty, notes, completed
     FROM install_tasks WHERE project_id = $1 ORDER BY type`,
    [projectId],
  );
  return rows.map((r) => ({
    id:        r.id,
    type:      r.type,
    qty:       Number(r.qty),
    notes:     r.notes ?? '',
    completed: r.completed,
  }));
}
