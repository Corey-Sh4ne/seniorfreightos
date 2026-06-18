const { query } = require('../index');
const { DEFAULT_RATE_CARD } = require('../../models/RateCard');

async function seed() {
  const {
    receivingPerLb,
    storagePerLbPerDay,
    freightPerLb,
    freightMinimum,
    fuelSurchargePct,
    rushSurchargePct,
    overheadPct,
    marginPct,
  } = DEFAULT_RATE_CARD;

  await query(
    `CREATE TABLE IF NOT EXISTS rate_cards (
      id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      receiving_per_lb     NUMERIC NOT NULL,
      storage_per_lb_per_day NUMERIC NOT NULL,
      freight_per_lb       NUMERIC NOT NULL,
      freight_minimum      NUMERIC NOT NULL,
      fuel_surcharge_pct   NUMERIC NOT NULL,
      rush_surcharge_pct   NUMERIC NOT NULL,
      overhead_pct         NUMERIC NOT NULL,
      margin_pct           NUMERIC NOT NULL
    )`,
  );

  const existing = await query('SELECT id FROM rate_cards LIMIT 1');
  if (existing.rows.length > 0) {
    console.log('rate_cards already seeded — skipping');
    return;
  }

  await query(
    `INSERT INTO rate_cards (
      receiving_per_lb, storage_per_lb_per_day, freight_per_lb,
      freight_minimum, fuel_surcharge_pct, rush_surcharge_pct,
      overhead_pct, margin_pct
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [receivingPerLb, storagePerLbPerDay, freightPerLb,
     freightMinimum, fuelSurchargePct, rushSurchargePct,
     overheadPct, marginPct],
  );

  console.log('Default rate card seeded successfully');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
