/**
 * Shared definitions for the admin "View As" role switcher.
 *
 * The cookie value encodes the impersonated view:
 *   - 'admin'        -> no impersonation (cookie cleared)
 *   - 'dispatcher'   -> ops board
 *   - 'client:<Name>'-> client portal scoped to that clientName
 */
export const CLIENT_PREFIX = 'client:';

export const VIEW_AS_OPTIONS = [
  { value: 'admin',                              label: 'Admin View' },
  { value: 'dispatcher',                         label: 'View as Dispatcher' },
  { value: 'client:Brookdale Senior Living',     label: 'View as Client — Brookdale Senior Living' },
  { value: 'client:Sunrise Senior Living',       label: 'View as Client — Sunrise Senior Living' },
  { value: 'client:Direct Supply',               label: 'View as Client — Direct Supply' },
];

/** Extract the clientName from a 'client:<Name>' value, or null otherwise. */
export function parseClientName(viewAs) {
  if (typeof viewAs === 'string' && viewAs.startsWith(CLIENT_PREFIX)) {
    return viewAs.slice(CLIENT_PREFIX.length);
  }
  return null;
}

/** Human-readable label for the active-view banner, or null when not impersonating. */
export function viewAsBannerLabel(viewAs) {
  if (viewAs === 'dispatcher') return 'Dispatcher';
  const clientName = parseClientName(viewAs);
  if (clientName) return `Client — ${clientName}`;
  return null;
}
