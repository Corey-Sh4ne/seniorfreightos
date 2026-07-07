import Link from 'next/link';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Compact card for a pending (or denied) quote awaiting a client response. */
export default function QuoteCard({ quote }) {
  const denied = quote.status === 'denied';
  const accentColor = denied ? '#DC2626' : '#F59E0B';

  return (
    <article
      style={{
        background: 'white',
        border: `2px solid ${accentColor}`,
        borderLeft: `6px solid ${accentColor}`,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#9CA3AF',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            marginBottom: '4px',
          }}
        >
          {quote.code}
        </p>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {quote.facilityName}
        </h3>
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
          Sent {formatDate(quote.updatedAt)}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
        <span
          style={
            denied
              ? {
                  background: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #DC2626',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }
              : {
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #F59E0B',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }
          }
        >
          {denied ? 'Quote Denied' : 'Quote Pending'}
        </span>
        {quote.total != null && (
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            {USD.format(quote.total)}
          </span>
        )}
        <Link
          href={`/portal/quotes/${quote.id}`}
          style={{
            background: '#1F3864',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Review quote →
        </Link>
      </div>
    </article>
  );
}
