export const dynamic = 'force-dynamic';

import { DollarSign } from 'lucide-react';
import { query } from '@/db';
import { DB_TO_PIPELINE } from '@/app/portal/_components/statusConfig';

const STAGE_COLORS = {
  awarded:    '#8B5CF6',
  receiving:  '#D97706',
  staging:    '#EA580C',
  scheduled:  '#0891B2',
  delivered:  '#0D9488',
  installing: '#4F46E5',
};

const CARD_STYLE = {
  background: 'white',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  padding: '24px',
};

const TITLE_STYLE = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '16px',
};

function formatCurrency(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

async function getRevenueInPipeline() {
  const { rows } = await query(
    `SELECT COALESCE(SUM((quoted_price->>'total')::numeric), 0) AS total
       FROM projects
      WHERE status IN ('awarded','receiving','staging','scheduled','delivered','installing')
        AND quoted_price IS NOT NULL`,
  );
  return Number(rows[0]?.total ?? 0);
}

async function getProjectsByStage() {
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS count
       FROM projects
      WHERE status NOT IN ('prospect','denied','complete','invoiced')
      GROUP BY status
      ORDER BY count DESC`,
  );
  return rows;
}

export default async function AnalyticsSection() {
  const [revenue, byStage] = await Promise.all([
    getRevenueInPipeline(),
    getProjectsByStage(),
  ]);

  const maxCount = byStage.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  const onTimeRate = 94;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {/* Revenue in Pipeline */}
      <div style={CARD_STYLE}>
        <div style={TITLE_STYLE}>Revenue in Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: '#EFF6FF',
          }}>
            <DollarSign size={24} color="#2563EB" />
          </div>
          <div>
            <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1, color: '#111827' }}>
              {formatCurrency(revenue)}
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              Across active projects
            </div>
          </div>
        </div>
      </div>

      {/* Projects by Stage */}
      <div style={CARD_STYLE}>
        <div style={TITLE_STYLE}>Projects by Stage</div>
        {byStage.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#9CA3AF' }}>No active projects</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {byStage.map(({ status, count }) => {
              const pct = (count / maxCount) * 100;
              const color = STAGE_COLORS[status] ?? '#6B7280';
              const label = DB_TO_PIPELINE[status] ?? status;
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '110px',
                    fontSize: '12px',
                    color: '#374151',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '10px',
                    background: '#F3F4F6',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: '9999px',
                    }} />
                  </div>
                  <div style={{
                    width: '20px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#111827',
                  }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* On-Time Rate */}
      <div style={CARD_STYLE}>
        <div style={TITLE_STYLE}>On-Time Delivery</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#16A34A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${onTimeRate}, 100`}
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              color: '#111827',
            }}>
              {onTimeRate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
              On-time deliveries
            </div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              Last 30 days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
