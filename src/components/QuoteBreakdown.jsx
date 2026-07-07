/**
 * QuoteBreakdown — shared, presentational itemized quote renderer.
 *
 * Used by BOTH the admin Pricing Quote tab (dark theme) and the client portal
 * quote detail page (light theme). It renders a normalized breakdown object — the
 * exact shape persisted to projects.quoted_price and produced live client-side —
 * so the admin preview and the client-facing quote always look identical.
 *
 * No directive: safe to render from a server component or a client component.
 */
import { INSTALL_TASKS } from '@/app/rate-card/_lib/rateCardFields';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const LBS = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const TASK_LABELS = Object.fromEntries(INSTALL_TASKS.map((t) => [t.key, t.label]));

/** Format a per-unit rate, allowing extra precision for sub-dollar amounts. */
function fmtRate(n) {
  return `$${Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/** Format a decimal rate (0.09) as a whole-ish percent (9%). */
function fmtPct(n) {
  return `${parseFloat((((n ?? 0) * 100)).toFixed(2))}%`;
}

const THEMES = {
  dark: {
    detail: 'text-blue-300/80',
    label: 'text-blue-100',
    amount: 'text-blue-100',
    border: 'border-blue-800/60',
    section: 'text-blue-200',
    rush: 'text-amber-300',
    subtotalBorder: 'border-blue-700',
    subtotalText: 'text-blue-100',
    totalBorder: 'border-white/80',
    totalText: 'text-white',
  },
  light: {
    detail: 'text-zinc-400',
    label: 'text-zinc-600',
    amount: 'text-zinc-800',
    border: 'border-zinc-100',
    section: 'text-zinc-500',
    rush: 'text-amber-600',
    subtotalBorder: 'border-zinc-300',
    subtotalText: 'text-zinc-900',
    totalBorder: 'border-zinc-300',
    totalText: 'text-zinc-900',
  },
};

function Row({ t, label, detail, amount, rush, strong }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 border-b ${t.border}`}>
      <div className="min-w-0">
        <p className={`text-sm ${rush ? `${t.rush} font-medium` : `${t.label} ${strong ? 'font-semibold' : ''}`}`}>
          {label}
        </p>
        {detail && <p className={`text-xs ${rush ? t.rush : t.detail} mt-0.5`}>{detail}</p>}
      </div>
      <span className={`shrink-0 text-sm font-medium ${rush ? t.rush : t.amount}`}>
        {USD.format(amount ?? 0)}
      </span>
    </div>
  );
}

export default function QuoteBreakdown({ breakdown, theme = 'light' }) {
  const t = THEMES[theme] ?? THEMES.light;
  if (!breakdown) return null;

  const {
    receiving, storage, freight, fuel, rush,
    installTasks, installCost, subtotal, overhead, margin, total,
  } = breakdown;
  const tasks = Array.isArray(installTasks) ? installTasks : [];

  return (
    <div>
      {receiving && (
        <Row
          t={t}
          label="Receiving"
          detail={`${LBS.format(receiving.weight || 0)} lbs × ${fmtRate(receiving.rate || 0)}/lb`}
          amount={receiving.total}
        />
      )}
      {storage && (
        <Row
          t={t}
          label="Storage"
          detail={`${LBS.format(storage.weight || 0)} lbs × ${storage.days || 0} days × ${fmtRate(storage.rate || 0)}/lb/day`}
          amount={storage.total}
        />
      )}
      {freight && (
        <Row
          t={t}
          label="Freight"
          detail={`${LBS.format(freight.weight || 0)} lbs × ${fmtRate(freight.rate || 0)}/lb (min ${USD.format(freight.min || 0)})`}
          amount={freight.total}
        />
      )}
      {fuel && (
        <Row t={t} label="Fuel Surcharge" detail={fmtPct(fuel.pct)} amount={fuel.total} />
      )}
      {rush && (
        <Row t={t} label="Rush Surcharge" detail={fmtPct(rush.pct)} amount={rush.total} rush />
      )}

      {tasks.length > 0 && (
        <div className={`pt-3 pb-1`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${t.section}`}>
            Install Tasks
          </p>
        </div>
      )}
      {tasks.map((task, i) => (
        <Row
          t={t}
          key={`${task.type}-${i}`}
          label={TASK_LABELS[task.type] ?? task.type}
          detail={`${task.qty} × ${fmtRate(task.rate)}`}
          amount={task.total}
        />
      ))}
      {tasks.length > 0 && installCost != null && (
        <Row t={t} label="Install Subtotal" amount={installCost} strong />
      )}

      {subtotal != null && (
        <div className={`mt-3 pt-3 border-t ${t.subtotalBorder} flex items-center justify-between`}>
          <span className={`text-sm font-semibold ${t.subtotalText}`}>Subtotal</span>
          <span className={`text-sm font-semibold ${t.subtotalText}`}>{USD.format(subtotal)}</span>
        </div>
      )}
      {overhead && (
        <Row t={t} label="Overhead" detail={fmtPct(overhead.pct)} amount={overhead.total} />
      )}
      {margin && (
        <Row t={t} label="Margin" detail={fmtPct(margin.pct)} amount={margin.total} />
      )}

      <div className={`mt-4 pt-3 border-t-2 ${t.totalBorder} flex items-center justify-between`}>
        <span className={`text-base font-bold ${t.totalText}`}>Total</span>
        <span className={`text-3xl font-extrabold ${t.totalText}`}>{USD.format(total ?? 0)}</span>
      </div>
    </div>
  );
}
