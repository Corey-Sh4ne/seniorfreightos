/**
 * quote.js — Shared helpers for the admin → portal quote flow.
 *
 * Recomputes pricing server-side (never trusting client-supplied totals) and
 * distills the full pricingEngine breakdown down to the client-facing line items
 * that get snapshotted into projects.quoted_price.
 *
 * pricingEngine.js is the single source of truth for the math and is never
 * modified here.
 */
import { calculateProjectPricing } from '@/utils/pricingEngine';

/**
 * DB install task types → pricingEngine task types.
 * The migration schema uses shorthand keys; pricingEngine uses full keys.
 * Mirrors the map in src/app/projects/[id]/page.jsx.
 */
const TASK_TYPE_MAP = {
  assemble:     'assemble_furniture',
  hang_art:     'hang_artwork',
  mount_tv:     'mount_tv_fixture',
  place:        'place_and_position',
  debris:       'debris_removal',
  window_treat: 'install_window_treatments',
};

/** True when the project's snapshotted rate card has the fields pricing needs. */
export function hasRateCard(rates) {
  return !!rates && rates.receivingPerLb != null && rates.freightPerLb != null;
}

/**
 * Compute the full pricing breakdown for a project, mapping DB task types first.
 * Returns null if the rate card is not configured or the snapshot is incomplete.
 */
export function computeProjectPricing(project, shipments, installTasks) {
  if (!hasRateCard(project.rates)) return null;
  try {
    const mappedTasks = installTasks.map((t) => ({
      ...t,
      type: TASK_TYPE_MAP[t.type] ?? t.type,
    }));
    return calculateProjectPricing(project, shipments, mappedTasks);
  } catch {
    return null;
  }
}

/**
 * Compute the full pricing breakdown for a project against an EXPLICIT rate card,
 * rather than the snapshot baked into project.rates. Used when an admin sends a
 * quote with a freshly chosen rate card. Returns null if the card is incomplete.
 */
export function computePricingWithRates(project, shipments, installTasks, rates) {
  return computeProjectPricing({ ...project, rates }, shipments, installTasks);
}

/**
 * Distill a full pricing breakdown into the itemized quote shown to the client.
 * This is the exact shape persisted to projects.quoted_price (jsonb) and is the
 * same shape the admin tab computes client-side, so both render identically via
 * the shared <QuoteBreakdown /> component.
 *
 * @param {object} pricing - output of calculateProjectPricing
 * @param {object} rates   - the rate card used (for displayed rates + percentages)
 * @param {{storageDays:number, rushDelivery:boolean}} project
 */
export function buildFullQuoteBreakdown(pricing, rates, project) {
  const w = pricing.totalWeight;
  return {
    totalWeight: w,
    receiving: { weight: w, rate: rates.receivingPerLb, total: pricing.receivingCost },
    storage:   { weight: w, days: project.storageDays, rate: rates.storagePerLbPerDay, total: pricing.storageCost },
    freight:   { weight: w, rate: rates.freightPerLb, min: rates.freightMinimum, total: pricing.freightCost },
    fuel:      { pct: rates.fuelSurchargePct, total: pricing.fuelSurcharge },
    rush:      project.rushDelivery ? { pct: rates.rushSurchargePct, total: pricing.rushSurcharge } : null,
    installTasks: pricing.installLineItems.map((li) => ({
      type: li.type, qty: li.qty, rate: li.rate, total: li.amount,
    })),
    installCost: pricing.installCost,
    subtotal:    pricing.directCost,
    overhead:    { pct: rates.overheadPct, total: pricing.overhead },
    margin:      { pct: rates.marginPct, total: pricing.margin },
    total:       pricing.totalProjectBid,
  };
}
