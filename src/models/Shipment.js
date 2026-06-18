/**
 * Shipment — child of Project. Represents one vendor's inbound freight.
 * weightPerUnitLbs is the single most important field — it drives all pricing.
 */

const SHIPMENT_CATEGORIES = [
  'Casegoods',
  'Seating',
  'Mattresses & Bedding',
  'Window Treatments',
  'Art & Decor',
  'Lighting',
  'Signage',
  'Appliances',
  'Flooring',
  'Outdoor Furniture',
  'Fitness Equipment',
];

/**
 * @typedef {Object} Shipment
 * @property {string}  id               - UUID primary key
 * @property {string}  projectId        - FK → Project.id
 * @property {string}  vendor           - Manufacturer / vendor name
 * @property {string}  category         - One of SHIPMENT_CATEGORIES
 * @property {string}  description
 * @property {number}  qty              - Unit count
 * @property {number}  weightPerUnitLbs - Per-unit weight; drives all pricing
 * @property {number}  cartons          - Carton count per unit
 * @property {Date}    eta              - Expected arrival at hub
 * @property {boolean} received         - true when warehouse confirms receipt
 */

module.exports = { SHIPMENT_CATEGORIES };
