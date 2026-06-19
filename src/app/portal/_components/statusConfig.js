import { PIPELINE_STATUSES } from '@/utils/statusPipeline';

/**
 * The DB / Project model stores lowercase machine statuses that do not match the
 * human-readable PIPELINE_STATUSES used across the portal UI. This map bridges
 * the two so the status rail, pills, border accents, and progress bars all work.
 */
export const DB_TO_PIPELINE = {
  prospect:   'Quote Requested',
  quoted:     'Quote Sent',
  awarded:    'Approved',
  receiving:  'Receiving',
  staging:    'Consolidating',
  scheduled:  'Out for Delivery',
  installing: 'Installing',
  complete:   'Complete',
  invoiced:   'Complete',
};

/** Normalizes any status (DB value or pipeline label) to a pipeline label. */
export function toPipelineStatus(status) {
  if (PIPELINE_STATUSES.includes(status)) return status;
  return DB_TO_PIPELINE[status] ?? status;
}

/** Index of the (normalized) status within the 9-stage pipeline, or -1. */
export function pipelineIndex(status) {
  return PIPELINE_STATUSES.indexOf(toPipelineStatus(status));
}

/** Number of completed stages (Complete counts as all 9). */
export function stagesComplete(status) {
  const idx = pipelineIndex(status);
  const total = PIPELINE_STATUSES.length;
  if (idx < 0) return 0;
  return idx === total - 1 ? total : idx;
}

/** Overall completion percentage across the 9 stages (0-100). */
export function completionPercent(status) {
  return Math.round((stagesComplete(status) / PIPELINE_STATUSES.length) * 100);
}

/**
 * Tailwind classes for the colored status pill, keyed on pipeline stage:
 *   Quote Requested / Quote Sent -> gray
 *   Approved                     -> purple
 *   Receiving / Consolidating    -> blue
 *   Out for Delivery / Delivered -> amber
 *   Installing                   -> orange
 *   Complete                     -> green
 */
export function pillStyle(status) {
  const idx = pipelineIndex(status);
  if (idx < 0)  return 'bg-zinc-100   text-zinc-500   border-zinc-200';
  if (idx <= 1) return 'bg-zinc-100   text-zinc-600   border-zinc-200';
  if (idx === 2) return 'bg-violet-50 text-violet-700 border-violet-100';
  if (idx <= 4) return 'bg-blue-50    text-blue-700   border-blue-100';
  if (idx <= 6) return 'bg-amber-50   text-amber-700  border-amber-100';
  if (idx === 7) return 'bg-orange-50 text-orange-700 border-orange-100';
  return 'bg-emerald-50 text-emerald-700 border-emerald-100';
}

/** Left-border accent hue matching the pill color family for each stage. */
export function borderAccent(status) {
  const idx = pipelineIndex(status);
  if (idx < 0)  return 'border-l-zinc-300';
  if (idx <= 1) return 'border-l-zinc-300';
  if (idx === 2) return 'border-l-violet-400';
  if (idx <= 4) return 'border-l-blue-400';
  if (idx <= 6) return 'border-l-amber-400';
  if (idx === 7) return 'border-l-orange-400';
  return 'border-l-emerald-400';
}
