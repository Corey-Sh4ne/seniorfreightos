import { query } from '@/db/index';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Fetch all projects joined with shipment counts and total weight.
 * Returns rows shaped to match the dashboard UI field names.
 */
export async function getProjects() {
  const sql = `
    SELECT
      p.id,
      p.code,
      p.client_name           AS client,
      p.facility_name         AS facility,
      p.status,
      p.miles_from_hub        AS miles,
      p.rush_delivery         AS rush,
      p.created_at,
      COALESCE(s.ships_total,    0) AS "shipsTotal",
      COALESCE(s.ships_received, 0) AS "shipsReceived",
      COALESCE(s.total_weight,   0) AS weight
    FROM projects p
    LEFT JOIN (
      SELECT
        project_id,
        COUNT(*)                                    AS ships_total,
        COUNT(*) FILTER (WHERE received = TRUE)     AS ships_received,
        SUM(weight_per_unit_lbs * qty)              AS total_weight
      FROM shipments
      GROUP BY project_id
    ) s ON s.project_id = p.id
    ORDER BY p.created_at DESC
  `;

  const { rows } = await query(sql);

  return rows.map((row) => ({
    id:            row.id,
    code:          row.code,
    client:        row.client,
    facility:      row.facility,
    status:        row.status,
    miles:         Number(row.miles),
    rush:          row.rush,
    created:       DATE_FMT.format(new Date(row.created_at)),
    shipsTotal:    Number(row.shipsTotal),
    shipsReceived: Number(row.shipsReceived),
    weight:        Number(row.weight),
  }));
}
