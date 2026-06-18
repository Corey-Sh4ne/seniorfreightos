/**
 * Project — top-level FF&E project entity.
 * Rate card values are snapshotted at quote time (see RateCard.js).
 */

const PROJECT_STATUSES = [
  'prospect',
  'quoted',
  'awarded',
  'receiving',
  'staging',
  'scheduled',
  'installing',
  'complete',
  'invoiced',
];

/**
 * @typedef {Object} ProjectRatesSnapshot
 * @property {number} receivingPerLb
 * @property {number} storagePerLbPerDay
 * @property {number} freightPerLb
 * @property {number} freightMinimum
 * @property {number} fuelSurchargePct
 * @property {number} rushSurchargePct
 * @property {number} overheadPct
 * @property {number} marginPct
 */

/**
 * @typedef {Object} Project
 * @property {string}               id              - UUID primary key
 * @property {string}               code            - Human-readable, e.g. FFE-2026-0001
 * @property {string}               clientName
 * @property {string}               facilityName
 * @property {string}               facilityAddress
 * @property {string}               contactName
 * @property {string}               contactEmail
 * @property {number}               milesFromHub    - Drives freight distance factor
 * @property {string}               status          - One of PROJECT_STATUSES
 * @property {number}               storageDays     - Days staged before outbound delivery
 * @property {boolean}              rushDelivery    - Applies rush surcharge when true
 * @property {ProjectRatesSnapshot} rates           - Snapshotted at quote time
 * @property {string}               notes           - COI requirements, delivery windows, etc.
 * @property {Date}                 createdAt
 * @property {Date}                 updatedAt
 */

module.exports = { PROJECT_STATUSES };
