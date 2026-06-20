/**
 * Shared, framework-agnostic helpers for the Rate Card feature.
 *
 * Safe to import from BOTH server (page / actions) and client components: it
 * contains no server-only imports and no 'use server' / 'use client' directive.
 *
 * NOTE: the install-task keys here are the FULL keys used by pricingEngine's
 * INSTALL_TASK_RATES (assemble_furniture, hang_artwork, …). They must stay in
 * sync so per-task rate overrides flow into the pricing engine correctly.
 */

export const INSTALL_TASKS = [
  { key: 'assemble_furniture',         label: 'Assemble Furniture' },
  { key: 'hang_artwork',               label: 'Hang Artwork' },
  { key: 'mount_tv_fixture',           label: 'Mount TV / Fixture' },
  { key: 'place_and_position',         label: 'Place & Position' },
  { key: 'debris_removal',             label: 'Debris Removal' },
  { key: 'install_window_treatments',  label: 'Install Window Treatments' },
];

export const INSTALL_TASK_KEYS = INSTALL_TASKS.map((t) => t.key);

/** Numeric rate fields stored as plain dollar amounts (not percentages). */
export const AMOUNT_FIELDS = [
  'receivingPerLb',
  'storagePerLbPerDay',
  'freightPerLb',
  'freightMinimum',
];

/** Rate fields stored as decimals (0.09) but edited as whole percents (9). */
export const PERCENT_FIELDS = [
  'fuelSurchargePct',
  'rushSurchargePct',
  'overheadPct',
  'marginPct',
];

/** Convert a stored decimal (0.09) to a display percentage (9). */
export function toPct(v) {
  return parseFloat((((v ?? 0) * 100)).toFixed(6));
}

/** Map a DB rate_cards row to the shape the UI works with. */
export function rowToRateCard(row) {
  const rates = row.rates ?? {};
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default === true,
    rates: {
      receivingPerLb:     parseFloat(rates.receivingPerLb),
      storagePerLbPerDay: parseFloat(rates.storagePerLbPerDay),
      freightPerLb:       parseFloat(rates.freightPerLb),
      freightMinimum:     parseFloat(rates.freightMinimum),
      fuelSurchargePct:   parseFloat(rates.fuelSurchargePct),
      rushSurchargePct:   parseFloat(rates.rushSurchargePct),
      overheadPct:        parseFloat(rates.overheadPct),
      marginPct:          parseFloat(rates.marginPct),
      installTaskRates:   rates.installTaskRates ?? {},
    },
  };
}
