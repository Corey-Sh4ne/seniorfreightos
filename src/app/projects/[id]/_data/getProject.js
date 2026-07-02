import { query } from '@/db/index';
import { rowToRateCard } from '@/app/rate-card/_lib/rateCardFields';

/**
 * Fetch a single project by UUID.
 * Returns null if not found.
 */
export async function getProjectById(id) {
  const { rows } = await query(
    `SELECT id, code, client_name, facility_name, facility_address,
            contact_name, contact_email, miles_from_hub, status,
            storage_days, rush_delivery, rates, notes, stage_notes,
            created_at, updated_at, quoted_price, accepted_at
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
    stageNotes:      r.stage_notes ?? {},
    createdAt:       r.created_at,
    updatedAt:       r.updated_at,
    quotedPrice:     r.quoted_price ?? null,
    acceptedAt:      r.accepted_at ?? null,
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
 * Fetch the rate cards available for quoting a project, plus the IDs of the
 * client's assigned ("suggested") card and the system default card. The admin
 * quote tab uses these to build a grouped Rate Card dropdown and to recalculate
 * the quote client-side when the selection changes.
 *
 * @param {string} clientName - the project's client_name (for the suggested card)
 */
export async function getRateCardsForQuote(clientName) {
  const [cardsRes, assignmentRes] = await Promise.all([
    query('SELECT * FROM rate_cards ORDER BY name ASC'),
    clientName
      ? query(
          'SELECT rate_card_id FROM client_rate_assignments WHERE client_name = $1',
          [clientName],
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const rateCards = cardsRes.rows.map(rowToRateCard);
  const defaultCard = rateCards.find((c) => c.isDefault) ?? null;
  const suggestedRateCardId = assignmentRes.rows[0]?.rate_card_id ?? null;

  return {
    rateCards,
    suggestedRateCardId,
    defaultRateCardId: defaultCard?.id ?? null,
  };
}

/**
 * Fetch the activity_log entries for a project, newest first.
 * Returns an array of camelCased rows suitable for the History tab.
 */
export async function getActivityLogByProjectId(projectId) {
  const { rows } = await query(
    `SELECT id, actor_name, actor_role, action, detail, created_at
     FROM activity_log
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [projectId],
  );
  return rows.map((r) => ({
    id:        r.id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action:    r.action,
    detail:    r.detail ?? null,
    createdAt: r.created_at,
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
