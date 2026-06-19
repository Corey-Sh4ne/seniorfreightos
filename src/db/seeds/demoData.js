const { query, pool } = require('../index');

/**
 * Demo data seed — realistic FF&E logistics projects for a senior living operator.
 *
 * Run with: node src/db/seeds/demoData.js
 * Requires DATABASE_URL to be set in the environment (see src/db/index.js).
 *
 * NOTE: the projects/shipments/install_tasks tables enforce CHECK constraints.
 * Some requested labels are mapped to the closest allowed enum value so the
 * inserts succeed against the existing schema (migrations are not modified):
 *   - project status "approved"            -> "awarded"
 *   - shipment category "Bedroom"/"Tables" -> "Casegoods"
 *   - shipment category "Lounge"/"Dining"  -> "Seating"
 *   - install task long names              -> assemble / place / hang_art /
 *                                             debris / window_treat
 */

const PROJECTS = [
  {
    code: 'FTE-2026-003',
    client_name: 'Brookdale Senior Living',
    facility_name: 'Brookdale Naperville East',
    facility_address: '1515 N Naper Blvd, Naperville, IL 60563',
    contact_name: 'Sarah Mitchell',
    contact_email: 'smitchell@brookdale.com',
    miles_from_hub: 42,
    storage_days: 14,
    rush_delivery: false,
    status: 'installing',
    notes: 'Full FF&E package for 120-unit memory care wing renovation',
    shipments: [
      { vendor: 'Ashley Furniture', category: 'Casegoods', description: 'Queen bed frames', qty: 40, weight_per_unit_lbs: 85, cartons: 40, eta: '2026-06-01', received: true },
      { vendor: 'La-Z-Boy Contract', category: 'Seating', description: 'Recliner chairs', qty: 60, weight_per_unit_lbs: 45, cartons: 60, eta: '2026-06-03', received: true },
      { vendor: 'Kwalu', category: 'Casegoods', description: 'Dresser units', qty: 40, weight_per_unit_lbs: 120, cartons: 40, eta: '2026-06-05', received: true },
    ],
    tasks: [
      { type: 'assemble', qty: 40, completed: true },
      { type: 'place', qty: 80, completed: true },
      { type: 'hang_art', qty: 24, completed: false },
      { type: 'debris', qty: 1, completed: false },
    ],
  },
  {
    code: 'FTE-2026-004',
    client_name: 'Sunrise Senior Living',
    facility_name: 'Sunrise of Hinsdale',
    facility_address: '400 E Chicago Ave, Hinsdale, IL 60521',
    contact_name: 'Mark Reynolds',
    contact_email: 'mreynolds@sunrise.com',
    miles_from_hub: 28,
    storage_days: 7,
    rush_delivery: true,
    status: 'receiving',
    notes: 'Expedited delivery required - grand opening June 30',
    shipments: [
      { vendor: 'Kimball Hospitality', category: 'Seating', description: 'Dining chairs', qty: 80, weight_per_unit_lbs: 22, cartons: 40, eta: '2026-06-10', received: true },
      { vendor: 'National Office Furniture', category: 'Casegoods', description: 'Round dining tables', qty: 20, weight_per_unit_lbs: 95, cartons: 20, eta: '2026-06-22', received: false },
    ],
    tasks: [
      { type: 'assemble', qty: 20, completed: false },
      { type: 'place', qty: 100, completed: false },
    ],
  },
  {
    code: 'FTE-2026-005',
    client_name: 'Direct Supply',
    facility_name: 'Elmhurst Care Center',
    facility_address: '200 E Lake St, Elmhurst, IL 60126',
    contact_name: 'Jennifer Park',
    contact_email: 'jpark@directsupply.com',
    miles_from_hub: 19,
    storage_days: 21,
    rush_delivery: false,
    status: 'awarded',
    notes: 'Phase 1 of 3 - common areas and dining room only',
    shipments: [
      { vendor: 'Haworth', category: 'Seating', description: 'Modular lounge seating', qty: 12, weight_per_unit_lbs: 180, cartons: 24, eta: '2026-06-25', received: false },
      { vendor: 'Versteel', category: 'Seating', description: 'Commercial dining chairs', qty: 60, weight_per_unit_lbs: 18, cartons: 15, eta: '2026-06-28', received: false },
    ],
    tasks: [
      { type: 'assemble', qty: 12, completed: false },
      { type: 'place', qty: 72, completed: false },
      { type: 'window_treat', qty: 18, completed: false },
    ],
  },
];

async function insertProject(p) {
  const result = await query(
    `INSERT INTO projects (
       code, client_name, facility_name, facility_address,
       contact_name, contact_email, miles_from_hub, storage_days,
       rush_delivery, status, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [p.code, p.client_name, p.facility_name, p.facility_address,
     p.contact_name, p.contact_email, p.miles_from_hub, p.storage_days,
     p.rush_delivery, p.status, p.notes],
  );
  return result.rows[0].id;
}

async function insertShipment(projectId, s) {
  await query(
    `INSERT INTO shipments (
       project_id, vendor, category, description, qty,
       weight_per_unit_lbs, cartons, eta, received
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [projectId, s.vendor, s.category, s.description, s.qty,
     s.weight_per_unit_lbs, s.cartons, s.eta, s.received],
  );
}

async function insertTask(projectId, t) {
  await query(
    `INSERT INTO install_tasks (project_id, type, qty, completed)
     VALUES ($1,$2,$3,$4)`,
    [projectId, t.type, t.qty, t.completed],
  );
}

async function seed() {
  const codes = PROJECTS.map((p) => p.code);

  // Make the seed re-runnable: remove any prior demo rows for these project
  // codes. Shipments and install_tasks are removed automatically via the
  // ON DELETE CASCADE foreign keys.
  await query('DELETE FROM projects WHERE code = ANY($1)', [codes]);

  for (const p of PROJECTS) {
    const projectId = await insertProject(p);
    for (const s of p.shipments) {
      await insertShipment(projectId, s);
    }
    for (const t of p.tasks) {
      await insertTask(projectId, t);
    }
    console.log(
      `Seeded ${p.code} — ${p.shipments.length} shipments, ${p.tasks.length} install tasks`,
    );
  }

  console.log(`Demo data seeded successfully (${PROJECTS.length} projects)`);
}

seed()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await pool.end();
    process.exit(1);
  });
