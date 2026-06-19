import { completionPercent } from './statusConfig';

/**
 * Thin top progress bar showing overall completion across the 9 pipeline stages.
 * Designed to sit flush against the rounded top edge of a card.
 */
export default function CardProgressBar({ status }) {
  const percent = completionPercent(status);

  return (
    <div className="h-1 w-full bg-zinc-100 rounded-t-xl overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
