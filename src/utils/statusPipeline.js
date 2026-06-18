/**
 * Single source of truth for the project status pipeline.
 * Spec: docs/03-core-workflow-status.docx
 */

export const PIPELINE_STATUSES = [
  'Quote Requested',
  'Quote Sent',
  'Approved',
  'Receiving',
  'Consolidating',
  'Out for Delivery',
  'Delivered',
  'Installing',
  'Complete',
];

/**
 * Maps each status to the statuses it can legally transition to.
 * Transitions are forward-only; no skipping or reversing stages.
 */
export const VALID_TRANSITIONS = {
  'Quote Requested':  ['Quote Sent'],
  'Quote Sent':       ['Approved'],
  'Approved':         ['Receiving'],
  'Receiving':        ['Consolidating'],
  'Consolidating':    ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered':        ['Installing'],
  'Installing':       ['Complete'],
  'Complete':         [],
};

/**
 * Returns true if moving from currentStatus to nextStatus is a legal transition.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
export function isValidTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

/**
 * DELAYED_FLAG is a boolean overlay applied to a project on top of its current
 * status. It surfaces at-risk projects on the dashboard and can trigger proactive
 * client notifications. It is NOT a status replacement.
 */
export const DELAYED_FLAG = true;
