'use client';

import { useState } from 'react';

const TABS = ['Shipments', 'Install Tasks'];

export default function PortalDetailTabs({ shipments, installTasks }) {
  const [active, setActive] = useState('Shipments');

  return (
    <div>
      <div className="flex border-b border-zinc-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === 'Shipments' && <ShipmentsTab shipments={shipments} />}
      {active === 'Install Tasks' && <InstallTasksTab installTasks={installTasks} />}
    </div>
  );
}

function ShipmentsTab({ shipments }) {
  if (!shipments.length) {
    return <p className="text-zinc-500 text-sm">No shipments on record for this project.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
            <th className="pb-3 pr-4 font-medium">Vendor</th>
            <th className="pb-3 pr-4 font-medium">Category</th>
            <th className="pb-3 pr-4 font-medium">Description</th>
            <th className="pb-3 pr-4 font-medium text-right">Qty</th>
            <th className="pb-3 pr-4 font-medium text-right">Cartons</th>
            <th className="pb-3 pr-4 font-medium">ETA</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {shipments.map((s) => (
            <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
              <td className="py-3 pr-4 font-medium text-zinc-800 whitespace-nowrap">{s.vendor}</td>
              <td className="py-3 pr-4 text-zinc-600 whitespace-nowrap">{s.category ?? '—'}</td>
              <td className="py-3 pr-4 text-zinc-600 max-w-[200px] truncate">{s.description ?? '—'}</td>
              <td className="py-3 pr-4 text-zinc-800 text-right tabular-nums">{s.qty.toLocaleString()}</td>
              <td className="py-3 pr-4 text-zinc-800 text-right tabular-nums">{s.cartons.toLocaleString()}</td>
              <td className="py-3 pr-4 text-zinc-600 whitespace-nowrap">{s.eta ?? '—'}</td>
              <td className="py-3">
                <StatusBadge received={s.received} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstallTasksTab({ installTasks }) {
  if (!installTasks.length) {
    return <p className="text-zinc-500 text-sm">No install tasks on record for this project.</p>;
  }

  const completedCount = installTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        {completedCount} of {installTasks.length} task{installTasks.length !== 1 ? 's' : ''} complete
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-100">
              <th className="pb-3 pr-4 font-medium">Task Type</th>
              <th className="pb-3 pr-4 font-medium text-right">Qty</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {installTasks.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                <td className="py-3 pr-4 text-zinc-800 capitalize">
                  {t.type.replace(/_/g, ' ')}
                </td>
                <td className="py-3 pr-4 text-zinc-800 text-right tabular-nums">
                  {t.qty.toLocaleString()}
                </td>
                <td className="py-3">
                  <span
                    className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      t.completed
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-600',
                    ].join(' ')}
                  >
                    {t.completed ? 'Done' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ received }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        received ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      {received ? 'Received' : 'Pending'}
    </span>
  );
}
