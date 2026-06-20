'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setViewAs } from '../_actions/viewAsActions';
import { viewAsBannerLabel } from '../_lib/viewAsOptions';

/**
 * Sticky banner shown while an admin is impersonating another view. Provides an
 * "Exit" control that clears the viewAs cookie and returns to the admin view.
 */
export default function ViewAsBanner({ viewAs }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const label = viewAsBannerLabel(viewAs);
  if (!label) return null;

  function exit() {
    startTransition(async () => {
      await setViewAs('admin');
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-6 py-2.5 text-sm font-medium text-amber-950 shrink-0">
      <span>
        Viewing as: <span className="font-semibold">{label}</span>
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md bg-amber-900/15 px-2.5 py-1 text-xs font-semibold hover:bg-amber-900/25 disabled:opacity-50"
      >
        Exit to Admin View
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
