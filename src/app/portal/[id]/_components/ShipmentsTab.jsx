function StatusBadge({ received }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        received
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-amber-50 text-amber-700 border-amber-100',
      ].join(' ')}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${received ? 'bg-emerald-500' : 'bg-amber-400'}`}
      />
      {received ? 'Received' : 'Pending'}
    </span>
  );
}

export default function ShipmentsTab({ shipments }) {
  if (!shipments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-600">No shipments on record</p>
        <p className="text-xs text-zinc-400 mt-1">Shipments will appear here once added to the project.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-200">
            <th className="pb-3 pr-4 font-semibold">Vendor</th>
            <th className="pb-3 pr-4 font-semibold">Category</th>
            <th className="pb-3 pr-4 font-semibold">Description</th>
            <th className="pb-3 pr-4 font-semibold text-right">Qty</th>
            <th className="pb-3 pr-4 font-semibold text-right">Cartons</th>
            <th className="pb-3 pr-4 font-semibold">ETA</th>
            <th className="pb-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr
              key={s.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
            >
              <td className="py-3.5 pr-4 font-semibold text-zinc-900 whitespace-nowrap">{s.vendor}</td>
              <td className="py-3.5 pr-4 text-zinc-500 whitespace-nowrap">{s.category ?? '—'}</td>
              <td className="py-3.5 pr-4 text-zinc-600 max-w-[180px] truncate">{s.description ?? '—'}</td>
              <td className="py-3.5 pr-4 text-zinc-800 text-right tabular-nums font-medium">
                {s.qty.toLocaleString()}
              </td>
              <td className="py-3.5 pr-4 text-zinc-800 text-right tabular-nums font-medium">
                {s.cartons.toLocaleString()}
              </td>
              <td className="py-3.5 pr-4 text-zinc-500 whitespace-nowrap font-mono text-xs">{s.eta ?? '—'}</td>
              <td className="py-3.5">
                <StatusBadge received={s.received} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
