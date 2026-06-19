const CARDS = [
  {
    key: 'active',
    label: 'Active Projects',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-100',
  },
  {
    key: 'delayed',
    label: 'Delayed',
    suffix: ' ⚠',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-100',
  },
  {
    key: 'quotes',
    label: 'Pending Quotes',
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-100',
  },
  {
    key: 'doneWeek',
    label: 'Done This Week',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-100',
  },
];

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, suffix, colorClass, bgClass, borderClass }) => (
        <div
          key={key}
          className={`${bgClass} ${borderClass} rounded-xl border p-5`}
        >
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            {label}
          </p>
          <p className={`text-3xl font-bold ${colorClass} leading-none`}>
            {stats[key]}
            {suffix && <span className="text-2xl">{suffix}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}
