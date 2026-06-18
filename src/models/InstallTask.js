/**
 * InstallTask — child of Project. Represents one discrete installation task.
 * INSTALL_TASK_TYPES is intentionally extensible — add new types as needed.
 */

const INSTALL_TASK_TYPES = [
  'assemble',
  'hang_art',
  'mount_tv',
  'place',
  'debris',
  'window_treat',
];

/**
 * @typedef {Object} InstallTask
 * @property {string}  id        - UUID primary key
 * @property {string}  projectId - FK → Project.id
 * @property {string}  type      - One of INSTALL_TASK_TYPES
 * @property {number}  qty       - Number of units this task applies to
 * @property {string}  notes     - Room / location detail
 * @property {boolean} completed - V2: crew check-off in the field
 */

module.exports = { INSTALL_TASK_TYPES };
