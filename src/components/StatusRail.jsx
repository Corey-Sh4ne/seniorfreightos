import { PIPELINE_STATUSES } from '../utils/statusPipeline';

/**
 * Visual step-progress rail showing the 9-stage FF&E pipeline.
 *
 * Props:
 *   currentStatus {string} — one of PIPELINE_STATUSES; all preceding stages are
 *                            rendered as completed, the current stage is highlighted.
 */
export default function StatusRail({ currentStatus }) {
  const currentIndex = PIPELINE_STATUSES.indexOf(currentStatus);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-start min-w-max">
        {PIPELINE_STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isActive    = index === currentIndex;
          const isLast      = index === PIPELINE_STATUSES.length - 1;

          return (
            <div key={status} className="flex items-start">
              {/* Step node + label */}
              <div className="flex flex-col items-center w-[68px]">
                <div
                  className={[
                    'w-3 h-3 rounded-full shrink-0 transition-colors',
                    isCompleted ? 'bg-emerald-500'                          : '',
                    isActive    ? 'bg-blue-600 ring-2 ring-blue-200 ring-offset-1' : '',
                    !isCompleted && !isActive ? 'bg-zinc-200'               : '',
                  ].join(' ')}
                />
                <span
                  className={[
                    'mt-1 text-[10px] text-center leading-tight select-none',
                    isActive    ? 'text-blue-600 font-semibold' : '',
                    isCompleted ? 'text-emerald-600'            : '',
                    !isCompleted && !isActive ? 'text-zinc-400' : '',
                  ].join(' ')}
                >
                  {status}
                </span>
              </div>

              {/* Connector between nodes — absent after last step */}
              {!isLast && (
                <div
                  className={[
                    'mt-[5px] h-0.5 w-3 shrink-0',
                    isCompleted ? 'bg-emerald-400' : 'bg-zinc-200',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
