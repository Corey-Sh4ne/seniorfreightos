import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Roles permitted to use the Order Management System: dispatchers and warehouse
 * / install crew leads run day-to-day ops, and admins can do everything.
 */
export const OPS_ROLES = ['admin', 'dispatcher', 'install_crew_lead'];

/**
 * Reads the current user's role + display name fresh from the Clerk API (not
 * the cached session token, which can be stale). Returns { userId, role, name };
 * all null when signed out.
 */
export async function getCurrentRole() {
  const { userId } = await auth();
  if (!userId) return { userId: null, role: null, name: null };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const first = user.firstName ?? '';
  const last = user.lastName ?? '';
  const full = `${first} ${last}`.trim();
  const name = full || user.emailAddresses?.[0]?.emailAddress || 'Unknown';
  return { userId, role: user.publicMetadata?.role ?? null, name };
}

/**
 * Authorization gate for every ops entry point (page + server actions). Role is
 * enforced here at the API/server layer so it can never be bypassed by the UI.
 * On success, exposes `actor` so callers can attribute activity_log entries.
 *
 * @returns {Promise<{ok: boolean, role: string|null, actor?: {name:string, role:string}, reason?: string}>}
 */
export async function requireOpsRole() {
  const { userId, role, name } = await getCurrentRole();
  if (!userId) return { ok: false, role: null, reason: 'unauthenticated' };
  if (!OPS_ROLES.includes(role)) return { ok: false, role, reason: 'forbidden' };
  return { ok: true, role, actor: { name, role } };
}
