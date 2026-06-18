/**
 * pricingEngine.js — Pure pricing calculation for FF&E projects.
 *
 * calculateProjectPricing(project, shipments, installTasks) → PricingBreakdown
 *
 * All rate values come from project.rates (snapshotted at quote time).
 * No database access, no API calls, no side effects.
 * Validated against the worked example in docs/05-pricing-engine.docx.
 */

/** @type {Record<string, number>} Default per-unit install labor rates (USD) */
const INSTALL_TASK_RATES = {
  assemble_furniture:       35,
  hang_artwork:             18,
  mount_tv_fixture:         45,
  place_and_position:        8,
  debris_removal:            6,
  install_window_treatments: 22,
};

/**
 * Round a number to 2 decimal places.
 * Applied after each calculated line item so cumulative totals match the spec.
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate a full pricing breakdown for a project.
 *
 * @param {import('../models/Project').Project} project
 *   Must include: rates, milesFromHub, storageDays, rushDelivery
 *
 * @param {Array<{qty: number, weightPerUnitLbs: number}>} shipments
 *   All shipments belonging to the project.
 *
 * @param {Array<{type: string, qty: number}>} installTasks
 *   All install tasks belonging to the project.
 *   task.type must be a key of INSTALL_TASK_RATES (or rates.installTaskRates if present).
 *
 * @returns {PricingBreakdown}
 */
function calculateProjectPricing(project, shipments, installTasks) {
  const {
    receivingPerLb,
    storagePerLbPerDay,
    freightPerLb,
    freightMinimum,
    fuelSurchargePct,
    rushSurchargePct,
    overheadPct,
    marginPct,
  } = project.rates;

  const { milesFromHub, storageDays, rushDelivery } = project;

  // Task rates: prefer overrides baked into the project snapshot, fall back to defaults.
  const taskRates = project.rates.installTaskRates ?? INSTALL_TASK_RATES;

  // ── Step 1: Total Weight ────────────────────────────────────────────────────
  const totalWeight = shipments.reduce(
    (sum, s) => sum + s.qty * s.weightPerUnitLbs,
    0,
  );

  // ── Step 2: Receiving Cost ─────────────────────────────────────────────────
  const receivingCost = round2(totalWeight * receivingPerLb);

  // ── Step 3: Storage Cost ───────────────────────────────────────────────────
  const storageCost = round2(totalWeight * storagePerLbPerDay * storageDays);

  // ── Step 4: Outbound Freight ───────────────────────────────────────────────
  // Distance factor only scales above the 50-mile free zone.
  const distanceFactor = 1 + Math.max(0, milesFromHub - 50) * 0.0015;
  const freightCost = round2(
    Math.max(totalWeight * freightPerLb * distanceFactor, freightMinimum),
  );

  // ── Step 5: Fuel & Rush Surcharges ─────────────────────────────────────────
  const fuelSurcharge = round2(freightCost * fuelSurchargePct);
  const rushSurcharge = rushDelivery
    ? round2((freightCost + fuelSurcharge) * rushSurchargePct)
    : 0;

  // ── Step 6: Install Labor ──────────────────────────────────────────────────
  const installLineItems = installTasks.map((task) => {
    const rate = taskRates[task.type];
    if (rate === undefined) {
      throw new Error(`Unknown install task type: "${task.type}"`);
    }
    return { type: task.type, qty: task.qty, rate, amount: round2(task.qty * rate) };
  });
  const installCost = round2(
    installLineItems.reduce((sum, item) => sum + item.amount, 0),
  );

  // ── Step 7: Direct Cost Subtotal ───────────────────────────────────────────
  const directCost = round2(
    receivingCost + storageCost + freightCost + fuelSurcharge + rushSurcharge + installCost,
  );

  // ── Step 8: Overhead & Margin ──────────────────────────────────────────────
  const overhead         = round2(directCost * overheadPct);
  const fullyLoadedCost  = round2(directCost + overhead);
  const margin           = round2(fullyLoadedCost * marginPct);
  const totalProjectBid  = round2(fullyLoadedCost + margin);

  /**
   * @typedef {Object} PricingBreakdown
   * @property {number}   totalWeight
   * @property {number}   receivingCost
   * @property {number}   storageCost
   * @property {number}   distanceFactor
   * @property {number}   freightCost
   * @property {number}   fuelSurcharge
   * @property {number}   rushSurcharge
   * @property {Array}    installLineItems   - Per-task breakdown
   * @property {number}   installCost
   * @property {number}   directCost
   * @property {number}   overhead
   * @property {number}   fullyLoadedCost
   * @property {number}   margin
   * @property {number}   totalProjectBid
   */
  return {
    totalWeight,
    receivingCost,
    storageCost,
    distanceFactor,
    freightCost,
    fuelSurcharge,
    rushSurcharge,
    installLineItems,
    installCost,
    directCost,
    overhead,
    fullyLoadedCost,
    margin,
    totalProjectBid,
  };
}

module.exports = { calculateProjectPricing, INSTALL_TASK_RATES };
