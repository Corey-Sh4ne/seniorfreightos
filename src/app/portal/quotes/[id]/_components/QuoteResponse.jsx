'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptQuote, denyQuote } from '@/app/portal/[id]/_actions/quoteActions';

/**
 * Accept / Deny controls for a pending quote. The clientName is verified again at
 * the server layer inside acceptQuote / denyQuote — these are convenience guards.
 */
export default function QuoteResponse({ projectId, clientName, returnTo = '/portal' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function run(action, confirmMessage) {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const res = await action(projectId, clientName);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push(returnTo);
      router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() =>
            run(acceptQuote, 'Accept this quote? Your project will begin processing.')
          }
          disabled={pending}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed
                     text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
        >
          {pending ? 'Working…' : 'Accept Quote'}
        </button>
        <button
          onClick={() =>
            run(denyQuote, "Deny this quote? We'll follow up with a revised quote.")
          }
          disabled={pending}
          className="border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50
                     disabled:cursor-not-allowed font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
        >
          Deny Quote
        </button>
      </div>
    </div>
  );
}
