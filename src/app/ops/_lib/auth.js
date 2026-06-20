import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Roles permitted to use the Order Management System: dispatchers and warehouse
 * / install crew leads run day-to-day ops, and admins can do everything.
 */
export const OPS_ROLES = ['admin', 'dispatcher', 'install_crew_lead'];

/**
 * Reads the current user's role fresh from the Clerk API (not the cached session
 * token, which can be stale). Returns { userId, role }; both null when signed out.
 */
export async function getCurrentRole() {
  const { userId } = await auth();
  if (!userId) return { userId: null, role: null };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return { userId, role: user.publicMetadata?.role ?? null };
}

/**
 * Authorization gate for every ops entry point (page + server actions). Role is
 * enforced here at the API/server layer so it can never be bypassed by the UI.
 *
 * @returns {Promise<{ok: boolean, role: string|null, reason?: string}>}
 */
export async function requireOpsRole() {
  const { userId, role } = await getCurrentRole();
  if (!userId) return { ok: false, role: null, reason: 'unauthenticated' };
  if (!OPS_ROLES.includes(role)) return { ok: false, role, reason: 'forbidden' };
  return { ok: true, role };
}
