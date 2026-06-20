import Link from 'next/link';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Compact card for a pending (or denied) quote awaiting a client response. */
export default function QuoteCard({ quote }) {
  const denied = quote.status === 'denied';

  return (
    <Link href={`/portal/quotes/${quote.id}`} className="block group">
      <article
        className={`
          bg-white rounded-lg border border-zinc-200 border-l-4
          ${denied ? 'border-l-red-400' : 'border-l-amber-400'}
          shadow-sm transition-all duration-150
          group-hover:shadow-md group-hover:-translate-y-0.5
        `}
      >
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono font-medium text-zinc-400 tracking-widest uppercase mb-0.5">
              {quote.code}
            </p>
            <h3 className="text-base font-bold text-zinc-900 leading-snug truncate">
              {quote.facilityName}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Sent {formatDate(quote.updatedAt)}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`text-[11px] font-semibold border px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                denied
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              {denied ? 'Quote Denied' : 'Quote Pending'}
            </span>
            {quote.total != null && (
              <span className="text-lg font-bold text-zinc-900">{USD.format(quote.total)}</span>
            )}
            <span className="text-[11px] font-medium text-zinc-400 group-hover:text-blue-500 transition-colors">
              Review quote →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
