'use client';

import { useState, useTransition } from 'react';
import { acceptQuote, denyQuote } from '../_actions/quoteActions';
import EmailToast from '@/components/EmailToast';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function Line({ label, amount, danger }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-100">
      <span className={`text-sm ${danger ? 'text-red-600 font-medium' : 'text-zinc-600'}`}>{label}</span>
      <span className={`text-sm font-medium ${danger ? 'text-red-600' : 'text-zinc-800'}`}>
        {USD.format(amount)}
      </span>
    </div>
  );
}

function Breakdown({ q }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-5">
      <Line label="Freight" amount={q.freightCost} />
      <Line label="Storage" amount={q.storageCost} />
      <Line label="Install" amount={q.installCost} />
      {q.rushSurcharge > 0 && <Line label="Rush Surcharge" amount={q.rushSurcharge} danger />}
      <div className="mt-4 pt-3 border-t-2 border-zinc-300 flex items-center justify-between">
        <span className="text-base font-bold text-zinc-900">Total</span>
        <span className="text-3xl font-extrabold text-zinc-900">{USD.format(q.total)}</span>
      </div>
    </div>
  );
}

export default function QuotePanel({ project, clientName }) {
  const [pending, startTransition] = useTransition();
  const [emailToast, setEmailToast] = useState(null);
  const { status, quotedPrice } = project;

  if (status === 'awarded') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">
          Quote accepted — your project is underway
        </p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-5 py-4">
        <p className="text-sm font-medium text-zinc-500">
          You denied this quote. A revised quote will be sent shortly.
        </p>
      </div>
    );
  }

  // Only the 'quoted' state shows the interactive accept/deny panel.
  if (status !== 'quoted' || !quotedPrice) return null;

  function handleAccept() {
    if (!window.confirm('Accept this quote? Your project will move forward.')) return;
    startTransition(async () => {
      const res = await acceptQuote(project.id, clientName);
      if (res?.emailNotification) setEmailToast('Notification sent to your logistics team');
    });
  }

  function handleDeny() {
    if (!window.confirm('Deny this quote? You can request a revised quote afterward.')) return;
    startTransition(async () => {
      const res = await denyQuote(project.id, clientName);
      if (res?.emailNotification) setEmailToast('Notification sent to your logistics team');
    });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Your Quote</h3>
        <p className="text-sm text-zinc-500 mt-1">Review the breakdown below and respond.</p>
      </div>

      <Breakdown q={quotedPrice} />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAccept}
          disabled={pending}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed
                     text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          {pending ? 'Working…' : 'Accept Quote'}
        </button>
        <button
          onClick={handleDeny}
          disabled={pending}
          className="border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50
                     disabled:cursor-not-allowed font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          Deny Quote
        </button>
      </div>

      {emailToast && (
        <EmailToast message={emailToast} onDismiss={() => setEmailToast(null)} />
      )}
    </div>
  );
}
