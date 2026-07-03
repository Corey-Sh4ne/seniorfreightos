'use server';

import { revalidatePath } from 'next/cache';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { query } from '@/db/index';
import { logActivity } from '@/utils/activityLogger';
import { simulateEmailNotification } from '@/utils/notifyEmail';

const ADMIN_NOTIFY_EMAIL = 'admin@seniorfreightos.com';

/** Fetch the project code (used to label simulated admin-notification emails). */
async function getProjectCode(projectId) {
  const { rows } = await query('SELECT code FROM projects WHERE id = $1', [projectId]);
  return rows[0]?.code ?? projectId;
}

/**
 * Fetch the current caller's display name + role from Clerk for activity_log
 * attribution. Returns null when signed out. Never throws.
 */
async function getActor() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const first = user.firstName ?? '';
    const last = user.lastName ?? '';
    const full = `${first} ${last}`.trim();
    const name = full || user.emailAddresses?.[0]?.emailAddress || 'Unknown';
    return { name, role: user.publicMetadata?.role ?? 'unknown' };
  } catch {
    return null;
  }
}

/**
 * Verify the project belongs to the given client and is in a state where the
 * given current status is expected. Reads status fresh from the DB so the client
 * cannot spoof it. Returns { error } or { ok: true }.
 *
 * The client_name check is the portal's security boundary: a client may only act
 * on their own project, enforced here at the server layer (never UI-only).
 */
async function verifyOwnership(projectId, clientName, expectedStatus) {
  if (!clientName) return { error: 'Unauthorized.' };

  const { rows } = await query(
    'SELECT status FROM projects WHERE id = $1 AND client_name = $2',
    [projectId, clientName],
  );
  if (!rows.length) return { error: 'Project not found.' };
  if (rows[0].status !== expectedStatus) {
    return { error: 'This quote is no longer awaiting a response.' };
  }
  return { ok: true };
}

/**
 * Client accepts the quote: quoted -> awarded, stamping accepted_at.
 */
export async function acceptQuote(projectId, clientName) {
  const check = await verifyOwnership(projectId, clientName, 'quoted');
  if (check.error) return check;

  await query(
    `UPDATE projects
        SET status = 'awarded', accepted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND client_name = $2`,
    [projectId, clientName],
  );

  const actor = await getActor();
  if (actor) {
    await logActivity(projectId, actor.name, actor.role, 'Quote accepted by client', null);
  }

  const code = await getProjectCode(projectId);
  const subject = `Quote Accepted — ${code}`;
  const actorName = actor?.name ?? 'Client';
  const actorRole = actor?.role ?? 'client_user';
  await simulateEmailNotification(projectId, ADMIN_NOTIFY_EMAIL, subject, actorName, actorRole);

  revalidatePath('/portal');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath(`/portal/${projectId}`);
  return { ok: true, emailNotification: { to: ADMIN_NOTIFY_EMAIL, subject } };
}

/**
 * Client denies the quote: quoted -> denied.
 */
export async function denyQuote(projectId, clientName) {
  const check = await verifyOwnership(projectId, clientName, 'quoted');
  if (check.error) return check;

  await query(
    `UPDATE projects
        SET status = 'denied', updated_at = NOW()
      WHERE id = $1 AND client_name = $2`,
    [projectId, clientName],
  );

  const actor = await getActor();
  if (actor) {
    await logActivity(projectId, actor.name, actor.role, 'Quote denied by client', null);
  }

  const code = await getProjectCode(projectId);
  const subject = `Quote Denied — ${code}`;
  const actorName = actor?.name ?? 'Client';
  const actorRole = actor?.role ?? 'client_user';
  await simulateEmailNotification(projectId, ADMIN_NOTIFY_EMAIL, subject, actorName, actorRole);

  revalidatePath('/portal');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath(`/portal/${projectId}`);
  return { ok: true, emailNotification: { to: ADMIN_NOTIFY_EMAIL, subject } };
}
