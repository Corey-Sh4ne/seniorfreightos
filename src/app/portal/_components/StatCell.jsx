/** Compact label + value stat cell shared across portal cards. */
export default function StatCell({ label, value, valueClass = 'text-zinc-800' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5 whitespace-nowrap">
        {label}
      </p>
      <p className={`text-base font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
