import { PIPELINE_STATUSES } from '@/utils/statusPipeline';

/**
 * Compact segmented progress rail for portal project cards.
 * - Green  → completed stages (before current)
 * - Blue   → current (active) stage
 * - Gray   → future (incomplete) stages
 */
export default function PortalStatusRail({ currentStatus }) {
  const currentIndex = PIPELINE_STATUSES.indexOf(currentStatus);
  if (currentIndex < 0) return null;

  return (
    <div className="space-y-2">
      {/* Segmented bar */}
      <div className="flex items-center gap-0.5">
        {PIPELINE_STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isActive    = index === currentIndex;

          let colorClass = 'bg-zinc-200';
          if (isCompleted) colorClass = 'bg-emerald-400';
          if (isActive)    colorClass = 'bg-blue-500';

          return (
            <div
              key={status}
              title={status}
              className={`h-1.5 flex-1 rounded-sm transition-colors ${colorClass}`}
            />
          );
        })}
      </div>

      {/* Active stage label */}
      <p className="text-[11px] font-medium text-blue-600 leading-none">
        {currentStatus}
      </p>
    </div>
  );
}
