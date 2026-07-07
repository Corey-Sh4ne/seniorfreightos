require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set — check .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

function buildRates({
  receivingPerLb,
  storagePerLbPerDay,
  freightPerLb,
  freightMinimum,
  fuelSurchargePct,
  rushSurchargePct,
  assembleFurniture,
  hangArtwork,
  mountTvFixture,
  placeAndPosition,
  debrisRemoval,
  installWindowTreatments,
  overheadPct,
  marginPct,
}) {
  return {
    marginPct,
    overheadPct,
    freightPerLb,
    freightMinimum,
    receivingPerLb,
    fuelSurchargePct,
    rushSurchargePct,
    storagePerLbPerDay,
    installTaskRates: {
      hang_artwork: hangArtwork,
      debris_removal: debrisRemoval,
      mount_tv_fixture: mountTvFixture,
      assemble_furniture: assembleFurniture,
      place_and_position: placeAndPosition,
      install_window_treatments: installWindowTreatments,
    },
  };
}

const RATE_CARDS = [
  {
    name: 'Premium White Glove',
    rates: buildRates({
      receivingPerLb: 0.12,
      storagePerLbPerDay: 0.018,
      freightPerLb: 0.22,
      freightMinimum: 600,
      fuelSurchargePct: 0.10,
      rushSurchargePct: 0.20,
      assembleFurniture: 45,
      hangArtwork: 35,
      mountTvFixture: 55,
      placeAndPosition: 18,
      debrisRemoval: 22,
      installWindowTreatments: 40,
      overheadPct: 0.14,
      marginPct: 0.22,
    }),
  },
  {
    name: 'Standard Rate',
    rates: buildRates({
      receivingPerLb: 0.085,
      storagePerLbPerDay: 0.012,
      freightPerLb: 0.165,
      freightMinimum: 450,
      fuelSurchargePct: 0.09,
      rushSurchargePct: 0.15,
      assembleFurniture: 35,
      hangArtwork: 25,
      mountTvFixture: 40,
      placeAndPosition: 12,
      debrisRemoval: 15,
      installWindowTreatments: 28,
      overheadPct: 0.12,
      marginPct: 0.18,
    }),
  },
  {
    name: 'Budget Flex',
    rates: buildRates({
      receivingPerLb: 0.065,
      storagePerLbPerDay: 0.008,
      freightPerLb: 0.13,
      freightMinimum: 350,
      fuelSurchargePct: 0.07,
      rushSurchargePct: 0.12,
      assembleFurniture: 25,
      hangArtwork: 18,
      mountTvFixture: 30,
      placeAndPosition: 8,
      debrisRemoval: 10,
      installWindowTreatments: 20,
      overheadPct: 0.10,
      marginPct: 0.14,
    }),
  },
];

const CLIENT_INFO = {
  'Brookdale Senior Living': {
    rateCardName: 'Premium White Glove',
    contact_name: 'Jennifer Walsh',
    contact_email: 'jwalsh@brookdale.com',
    contact_phone: '(312) 555-0182',
  },
  'Sunrise Senior Living': {
    rateCardName: 'Standard Rate',
    contact_name: 'Marcus Reid',
    contact_email: 'mreid@sunrise.com',
    contact_phone: '(847) 555-0247',
  },
  'Direct Supply': {
    rateCardName: 'Budget Flex',
    contact_name: 'Priya Nair',
    contact_email: 'pnair@directsupply.com',
    contact_phone: '(414) 555-0391',
  },
};

const PROJECT_NOTES = {
  'FTE-2026-009': 'Memory care wing expansion — 48 resident rooms. Client requested white glove install. Tight move-in window.',
  'FTE-2026-010': 'East wing renovation phase 2. Continuation from FTE-2026-003. Priority receiving.',
  'FTE-2026-012': 'New Hinsdale location opening. Full FF&E package including common areas and 60 resident rooms.',
  'FTE-2026-014': 'Elmhurst expansion — additional 24 rooms. Direct Supply preferred vendor list applies.',
  'FTE-2026-015': 'Memory care annex. Rush delivery requested due to facility opening date.',
};

const STAGE_NOTES = {
  'FTE-2026-010': {
    receiving: 'All 3 vendors confirmed. Invacare delayed by 2 days — notified client. Storage bay 4 assigned.',
    consolidated: null,
    departed: null,
    delivered: null,
    installComplete: null,
  },
  'FTE-2026-013': {
    receiving: 'All shipments received and checked in.',
    consolidated: 'Freight consolidated at warehouse. 3 pallets total.',
    departed: 'Truck departed 7:02 AM. ETA facility 9:30 AM.',
    delivered: 'Delivered and signed off by facility manager R. Gomez.',
    installComplete: null,
  },
  'FTE-2026-014': {},
  'FTE-2026-015': {
    receiving: 'Invacare received 6/28. Kwalu still outstanding — ETA 7/3.',
    consolidated: null,
    departed: null,
    delivered: null,
    installComplete: null,
  },
};

async function main() {
  const summary = {};

  // ---- STEP 1: Rate Cards ----
  console.log('\n=== STEP 1: Rate Cards ===');
  const delRc = await query('DELETE FROM rate_cards WHERE is_default = false');
  summary.rateCardsDeleted = delRc.rowCount;
  console.log(`Deleted ${delRc.rowCount} non-default rate cards`);

  let inserted = 0;
  for (const rc of RATE_CARDS) {
    await query(
      'INSERT INTO rate_cards (name, rates, is_default) VALUES ($1, $2::jsonb, false)',
      [rc.name, JSON.stringify(rc.rates)]
    );
    inserted += 1;
    console.log(`Inserted rate card: ${rc.name}`);
  }
  summary.rateCardsInserted = inserted;

  const standard = RATE_CARDS.find(r => r.name === 'Standard Rate');
  const updDefault = await query(
    'UPDATE rate_cards SET rates = $1::jsonb, updated_at = NOW() WHERE is_default = true',
    [JSON.stringify(standard.rates)]
  );
  summary.defaultRateCardUpdated = updDefault.rowCount;
  console.log(`Updated default rate card to Standard Rate values (${updDefault.rowCount} row)`);

  // ---- STEP 2: Assign Rate Cards + contact info to clients ----
  console.log('\n=== STEP 2: Clients ===');
  const rcRows = await query('SELECT id, name FROM rate_cards WHERE is_default = false');
  const rcIdByName = Object.fromEntries(rcRows.rows.map(r => [r.name, r.id]));

  let clientsUpdated = 0;
  for (const [name, info] of Object.entries(CLIENT_INFO)) {
    const rateCardId = rcIdByName[info.rateCardName];
    if (!rateCardId) throw new Error(`Missing rate card: ${info.rateCardName}`);
    const r = await query(
      `UPDATE clients
       SET rate_card_id = $1,
           contact_name = $2,
           contact_email = $3,
           contact_phone = $4,
           updated_at = NOW()
       WHERE name = $5`,
      [rateCardId, info.contact_name, info.contact_email, info.contact_phone, name]
    );
    clientsUpdated += r.rowCount;
    console.log(`Updated client "${name}" → ${info.rateCardName} (${r.rowCount} row)`);
  }
  summary.clientsUpdated = clientsUpdated;

  // ---- STEP 3: Update all projects with contact info + specific notes ----
  console.log('\n=== STEP 3: Project contact info + notes ===');
  let projectsContactUpdated = 0;
  for (const [clientName, info] of Object.entries(CLIENT_INFO)) {
    const r = await query(
      `UPDATE projects
       SET contact_name = $1,
           contact_email = $2,
           updated_at = NOW()
       WHERE client_name = $3`,
      [info.contact_name, info.contact_email, clientName]
    );
    projectsContactUpdated += r.rowCount;
    console.log(`Updated ${r.rowCount} projects for ${clientName}`);
  }
  summary.projectsContactUpdated = projectsContactUpdated;

  let projectNotesUpdated = 0;
  for (const [code, notes] of Object.entries(PROJECT_NOTES)) {
    const r = await query(
      'UPDATE projects SET notes = $1, updated_at = NOW() WHERE code = $2',
      [notes, code]
    );
    projectNotesUpdated += r.rowCount;
    console.log(`Notes updated for ${code} (${r.rowCount} row)`);
  }
  summary.projectNotesUpdated = projectNotesUpdated;

  // ---- STEP 4: FTE-2026-016 ----
  console.log('\n=== STEP 4: FTE-2026-016 rename ===');
  const r016 = await query(
    `UPDATE projects
     SET facility_name = $1, notes = $2, updated_at = NOW()
     WHERE code = $3`,
    ['Brookdale Oak Park', 'Oak Park flagship location. Full white glove service.', 'FTE-2026-016']
  );
  summary.project016Updated = r016.rowCount;
  console.log(`Updated FTE-2026-016 (${r016.rowCount} row)`);

  // ---- STEP 5: Stage notes ----
  console.log('\n=== STEP 5: Stage notes ===');
  let stageNotesUpdated = 0;
  for (const [code, stageNotes] of Object.entries(STAGE_NOTES)) {
    const r = await query(
      'UPDATE projects SET stage_notes = $1::jsonb, updated_at = NOW() WHERE code = $2',
      [JSON.stringify(stageNotes), code]
    );
    stageNotesUpdated += r.rowCount;
    console.log(`Stage notes updated for ${code} (${r.rowCount} row)`);
  }
  summary.stageNotesUpdated = stageNotesUpdated;

  // ---- STEP 6: Rename FTE-2026-005 facility ----
  console.log('\n=== STEP 6: FTE-2026-005 facility rename ===');
  const r005 = await query(
    'UPDATE projects SET facility_name = $1, updated_at = NOW() WHERE code = $2',
    ['Elmhurst Care Center — Phase 2', 'FTE-2026-005']
  );
  summary.project005Updated = r005.rowCount;
  console.log(`Updated FTE-2026-005 facility (${r005.rowCount} row)`);

  // ---- Summary ----
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));

  await pool.end();
}

main().catch(err => {
  console.error('Seed failed:', err);
  pool.end();
  process.exit(1);
});
