'use client';

import { useTransition } from 'react';
import { markShipmentReceived } from '../_actions/projectActions';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day:   'numeric',
  timeZone: 'UTC',
});

function formatEta(isoDate) {
  if (!isoDate) return '—';
  return DATE_FMT.format(new Date(isoDate));
}

export default function ShipmentsTab({ shipments, projectId }) {
  const [pending, startTransition] = useTransition();

  function handleToggle(shipmentId, currentReceived) {
    startTransition(() => markShipmentReceived(shipmentId, !currentReceived, projectId));
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Vendor</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Lbs/Unit</th>
            <th className="px-4 py-3 text-right">Total Wt</th>
            <th className="px-4 py-3 text-left">ETA</th>
            <th className="px-4 py-3 text-center">Received</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {shipments.map((s) => (
            <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3 font-medium text-zinc-900">{s.vendor}</td>
              <td className="px-4 py-3 text-zinc-500 text-xs">{s.category}</td>
              <td className="px-4 py-3 text-zinc-600">{s.description}</td>
              <td className="px-4 py-3 text-right text-zinc-700">{s.qty}</td>
              <td className="px-4 py-3 text-right text-zinc-500">{s.weightPerUnitLbs} lb</td>
              <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                {(s.qty * s.weightPerUnitLbs).toLocaleString()} lb
              </td>
              <td className="px-4 py-3 text-zinc-500">{formatEta(s.eta)}</td>
              <td className="px-4 py-3 text-center">
                {s.received ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    ✓ Received
                  </span>
                ) : (
                  <button
                    onClick={() => handleToggle(s.id, s.received)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100
                               border border-emerald-300 text-emerald-700 text-xs font-medium
                               px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    Mark Received
                  </button>
                )}
              </td>
            </tr>
          ))}

          {!shipments.length && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-zinc-400 text-sm">
                No shipments on this project yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
