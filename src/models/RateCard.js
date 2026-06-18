/**
 * RateCard — company-level default rates.
 *
 * IMPORTANT: These values must be SNAPSHOTTED onto each Project at quote time.
 * Never link a project to the live rate card — always copy the values so that
 * historical quotes remain accurate if rates change later.
 *
 * Percentages are stored as decimals (e.g. 0.09 = 9%) so the pricing engine
 * can multiply directly without dividing by 100.
 */

/**
 * @typedef {Object} RateCard
 * @property {string} id                 - UUID primary key
 * @property {number} receivingPerLb     - Inbound handling cost ($/lb)
 * @property {number} storagePerLbPerDay - Staging cost while freight is consolidated ($/lb/day)
 * @property {number} freightPerLb       - Outbound consolidated freight rate ($/lb)
 * @property {number} freightMinimum     - Minimum outbound freight charge regardless of weight ($)
 * @property {number} fuelSurchargePct   - Applied to freight cost (decimal)
 * @property {number} rushSurchargePct   - Applied to freight + fuel when rushDelivery is true (decimal)
 * @property {number} overheadPct        - Applied to direct cost subtotal (decimal)
 * @property {number} marginPct          - Applied to fully loaded cost: direct + overhead (decimal)
 */

const DEFAULT_RATE_CARD = {
  receivingPerLb:     0.085,
  storagePerLbPerDay: 0.012,
  freightPerLb:       0.165,
  freightMinimum:     450,
  fuelSurchargePct:   0.09,
  rushSurchargePct:   0.18,
  overheadPct:        0.12,
  marginPct:          0.18,
};

module.exports = { DEFAULT_RATE_CARD };
