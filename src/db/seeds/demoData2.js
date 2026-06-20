const { query, pool } = require('../index');

/**
 * Demo data seed v2 — replaces the lighter v1 demo data with a full panel of
 * realistic FF&E projects across Brookdale, Sunrise, and Direct Supply, spread
 * across every meaningful pipeline stage (prospect, quoted, awarded, receiving,
 * staging, installing, complete).
 *
 * Run with:
 *   require('dotenv').config();
 *   require('./src/db/seeds/demoData2.js');
 *
 * Re-runnable: drops old test codes plus this script's own codes before
 * inserting. Existing FTE-2026-003, 004, 005 are left untouched.
 */

const PROJECTS = [
  // -------------------------------------------------------- BROOKDALE A: 009
  {
    code: 'FTE-2026-009',
    client_name: 'Brookdale Senior Living',
    facility_name: 'Brookdale Naperville Memory Care',
    facility_address: '1515 N Naper Blvd, Naperville, IL 60563',
    miles_from_hub: 42,
    storage_days: 14,
    rush_delivery: false,
    status: 'prospect',
    notes: 'Memory Care Wing Renovation',
    shipments: [
      { vendor: 'Ashley Furniture', category: 'Casegoods',            description: 'Memory care beds',              qty: 24, weight_per_unit_lbs: 85, cartons: 24, received: false },
      { vendor: 'Kwalu',            category: 'Seating',              description: 'Dementia-friendly chairs',      qty: 48, weight_per_unit_lbs: 22, cartons: 48, received: false },
      { vendor: 'Invacare',         category: 'Mattresses & Bedding', description: 'Pressure relief mattresses',    qty: 24, weight_per_unit_lbs: 35, cartons: 24, received: false },
    ],
    tasks: [
      { type: 'assemble',     qty: 24, notes: 'Bed assembly required',           completed: false },
      { type: 'place',        qty: 48, notes: 'Chair placement per floor plan',  completed: false },
      { type: 'window_treat', qty: 18, notes: 'Blackout curtains',               completed: false },
    ],
  },

  // -------------------------------------------------------- BROOKDALE B: 010
  {
    code: 'FTE-2026-010',
    client_name: 'Brookdale Senior Living',
    facility_name: 'Brookdale Naperville East',
    facility_address: '1515 N Naper Blvd, Naperville, IL 60563',
    miles_from_hub: 42,
    storage_days: 7,
    rush_delivery: false,
    status: 'receiving',
    notes: 'Assisted Living Common Areas',
    shipments: [
      { vendor: 'La-Z-Boy Contract',         category: 'Seating',     description: 'Recliners',           qty: 30, weight_per_unit_lbs: 95,  cartons: 30, received: false },
      { vendor: 'National Office Furniture', category: 'Casegoods',   description: 'Dining tables',       qty: 12, weight_per_unit_lbs: 120, cartons: 12, received: true  },
      { vendor: 'Uttermost',                 category: 'Art & Decor', description: 'Framed artwork sets', qty: 20, weight_per_unit_lbs: 8,   cartons: 20, received: false },
    ],
    tasks: [
      { type: 'place',    qty: 30, notes: 'Recliner placement in common areas', completed: false },
      { type: 'hang_art', qty: 20, notes: 'Artwork per layout diagram',         completed: false },
      { type: 'assemble', qty: 12, notes: 'Table assembly',                     completed: false },
    ],
  },

  // -------------------------------------------------------- BROOKDALE C: 011
  {
    code: 'FTE-2026-011',
    client_name: 'Brookdale Senior Living',
    facility_name: 'Brookdale Downers Grove',
    facility_address: '3800 Highland Ave, Downers Grove, IL 60515',
    miles_from_hub: 38,
    storage_days: 5,
    rush_delivery: false,
    status: 'complete',
    notes: 'Skilled Nursing Refresh',
    shipments: [
      { vendor: 'Stryker',       category: 'Mattresses & Bedding', description: 'Hospital-grade mattresses', qty: 40, weight_per_unit_lbs: 45, cartons: 40, received: true },
      { vendor: 'Herman Miller', category: 'Seating',              description: 'Patient room chairs',       qty: 40, weight_per_unit_lbs: 28, cartons: 40, received: true },
    ],
    tasks: [
      { type: 'place',    qty: 40, completed: true },
      { type: 'assemble', qty: 40, completed: true },
    ],
  },

  // ---------------------------------------------------------- SUNRISE D: 012
  {
    code: 'FTE-2026-012',
    client_name: 'Sunrise Senior Living',
    facility_name: 'Sunrise of Hinsdale',
    facility_address: '400 E Chicago Ave, Hinsdale, IL 60521',
    miles_from_hub: 28,
    storage_days: 10,
    rush_delivery: false,
    status: 'quoted',
    notes: 'Independent Living Apartments',
    quoted_price: {
      receiving:     { total: 485.10 },
      storage:       { total: 201.60 },
      freight:       { total: 924.75 },
      fuelSurcharge: { total: 83.23 },
      rushSurcharge: { total: 0 },
      installTasks:  { total: 2840.00 },
      subtotal: 4534.68,
      overhead: { total: 544.16 },
      margin:   { total: 916.95 },
      total: 5995.79,
    },
    shipments: [
      { vendor: 'Bernhardt',     category: 'Casegoods',            description: 'Living room furniture sets', qty: 18, weight_per_unit_lbs: 200, cartons: 54, received: false },
      { vendor: 'Sealy',         category: 'Mattresses & Bedding', description: 'Luxury mattresses',          qty: 18, weight_per_unit_lbs: 65,  cartons: 18, received: false },
      { vendor: 'Hunter Douglas', category: 'Window Treatments',   description: 'Motorized shades',           qty: 36, weight_per_unit_lbs: 12,  cartons: 36, received: false },
    ],
    tasks: [
      { type: 'assemble',     qty: 18, completed: false },
      { type: 'place',        qty: 18, completed: false },
      { type: 'window_treat', qty: 36, completed: false },
    ],
  },

  // ---------------------------------------------------------- SUNRISE E: 013
  {
    code: 'FTE-2026-013',
    client_name: 'Sunrise Senior Living',
    facility_name: 'Sunrise of Oak Brook',
    facility_address: '2 Mid America Plaza, Oak Brook, IL 60523',
    miles_from_hub: 33,
    storage_days: 8,
    rush_delivery: true,
    status: 'installing',
    notes: 'Dining Room Renovation',
    shipments: [
      { vendor: 'Kimball Hospitality',       category: 'Seating',   description: 'Banquet chairs', qty: 120, weight_per_unit_lbs: 18,  cartons: 30, received: true },
      { vendor: 'National Office Furniture', category: 'Casegoods', description: 'Dining tables',  qty: 24,  weight_per_unit_lbs: 110, cartons: 24, received: true },
    ],
    tasks: [
      { type: 'assemble', qty: 24,  completed: false },
      { type: 'place',    qty: 120, completed: true  },
      { type: 'debris',   qty: 1,   completed: true  },
    ],
  },

  // ----------------------------------------------------- DIRECT SUPPLY F: 014
  {
    code: 'FTE-2026-014',
    client_name: 'Direct Supply',
    facility_name: 'Elmhurst Care Center',
    facility_address: '200 Berteau Ave, Elmhurst, IL 60126',
    miles_from_hub: 19,
    storage_days: 21,
    rush_delivery: false,
    status: 'awarded',
    notes: 'New Facility Outfitting',
    shipments: [
      { vendor: 'Haworth',       category: 'Casegoods', description: 'Office and admin furniture', qty: 15,  weight_per_unit_lbs: 75, cartons: 15, received: false },
      { vendor: 'Versteel',      category: 'Seating',   description: 'Stack chairs',               qty: 200, weight_per_unit_lbs: 12, cartons: 20, received: false },
      { vendor: 'Acuity Brands', category: 'Lighting',  description: 'LED fixtures',               qty: 50,  weight_per_unit_lbs: 8,  cartons: 25, received: false },
    ],
    tasks: [
      { type: 'assemble', qty: 15,  completed: false },
      { type: 'place',    qty: 200, completed: false },
      { type: 'mount_tv', qty: 8,   notes: 'Common area TVs', completed: false },
    ],
  },

  // ----------------------------------------------------- DIRECT SUPPLY G: 015
  {
    code: 'FTE-2026-015',
    client_name: 'Direct Supply',
    facility_name: 'Elmhurst Memory Care Annex',
    facility_address: '200 Berteau Ave, Elmhurst, IL 60126',
    miles_from_hub: 19,
    storage_days: 12,
    rush_delivery: true,
    status: 'staging',
    notes: 'Memory Care Addition',
    shipments: [
      { vendor: 'Kwalu',    category: 'Seating',              description: 'Memory care seating',  qty: 60, weight_per_unit_lbs: 24, cartons: 60, received: true },
      { vendor: 'Invacare', category: 'Mattresses & Bedding', description: 'Specialty mattresses', qty: 20, weight_per_unit_lbs: 38, cartons: 20, received: true },
    ],
    tasks: [
      { type: 'place',        qty: 60, completed: false },
      { type: 'assemble',     qty: 20, completed: false },
      { type: 'window_treat', qty: 15, completed: false },
    ],
  },
];

const DROP_CODES = [
  'FTE-2026-001',
  'FTE-2026-002',
  'FTE-2026-006',
  'FTE-2026-007',
  'FTE-2026-008',
];

async function insertProject(p) {
  const { rows } = await query(
    `INSERT INTO projects (
       code, client_name, facility_name, facility_address,
       contact_name, contact_email, miles_from_hub, storage_days,
       rush_delivery, status, notes, quoted_price
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      p.code, p.client_name, p.facility_name, p.facility_address,
      p.contact_name ?? '', p.contact_email ?? '',
      p.miles_from_hub, p.storage_days,
      p.rush_delivery, p.status, p.notes ?? '',
      p.quoted_price ? JSON.stringify(p.quoted_price) : null,
    ],
  );
  return rows[0].id;
}

async function insertShipment(projectId, s) {
  await query(
    `INSERT INTO shipments (
       project_id, vendor, category, description, qty,
       weight_per_unit_lbs, cartons, eta, received
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      projectId, s.vendor, s.category, s.description, s.qty,
      s.weight_per_unit_lbs, s.cartons, s.eta ?? null, s.received ?? false,
    ],
  );
}

async function insertTask(projectId, t) {
  await query(
    `INSERT INTO install_tasks (project_id, type, qty, notes, completed)
     VALUES ($1,$2,$3,$4,$5)`,
    [projectId, t.type, t.qty, t.notes ?? '', t.completed ?? false],
  );
}

async function seed() {
  // Drop legacy test/leftover codes AND this script's own codes so re-runs work.
  const codesToDrop = [...DROP_CODES, ...PROJECTS.map((p) => p.code)];
  const { rowCount: droppedCount } = await query(
    'DELETE FROM projects WHERE code = ANY($1)',
    [codesToDrop],
  );
  console.log(`Dropped ${droppedCount} existing project rows for: ${codesToDrop.join(', ')}`);

  for (const p of PROJECTS) {
    const projectId = await insertProject(p);
    for (const s of p.shipments) await insertShipment(projectId, s);
    for (const t of p.tasks) await insertTask(projectId, t);
    console.log(
      `Seeded ${p.code} (${p.status}) — ${p.shipments.length} shipments, ${p.tasks.length} tasks`,
    );
  }

  console.log(`\nDemo data v2 seeded successfully: ${PROJECTS.length} projects`);
}

seed()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await pool.end();
    process.exit(1);
  });
