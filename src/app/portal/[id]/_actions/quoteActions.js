'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/db/index';

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

  revalidatePath('/portal');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath(`/portal/${projectId}`);
  return { ok: true };
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

  revalidatePath('/portal');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath(`/portal/${projectId}`);
  return { ok: true };
}
