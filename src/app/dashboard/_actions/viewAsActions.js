'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentRole } from '@/app/ops/_lib/auth';

/**
 * Set (or clear) the admin "View As" impersonation cookie.
 *
 * Access is enforced at the server layer: only admins may impersonate. A
 * non-admin calling this is a no-op, so the cookie can never be set by a
 * client user even if the UI is tampered with.
 */
export async function setViewAs(value) {
  const { role } = await getCurrentRole();
  if (role !== 'admin') return;

  const cookieStore = await cookies();

  if (!value || value === 'admin') {
    cookieStore.delete('viewAs');
  } else {
    cookieStore.set('viewAs', value, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  // Always land on /dashboard, which re-reads the cookie and renders the
  // correct view. This also resets any active sub-page from the prior view.
  redirect('/dashboard');
}
