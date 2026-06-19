import Link from 'next/link';
import { PIPELINE_STATUSES } from '@/utils/statusPipeline';
import PortalStatusRail from './PortalStatusRail';

/** Returns Tailwind classes for the colored status pill based on pipeline stage. */
function statusStyle(status) {
  const idx = PIPELINE_STATUSES.indexOf(status);
  if (idx < 0)                              return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  if (idx === PIPELINE_STATUSES.length - 1) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (idx >= 6)  return 'bg-blue-50   text-blue-700   border-blue-100';
  if (idx >= 4)  return 'bg-amber-50  text-amber-700  border-amber-100';
  if (idx >= 2)  return 'bg-sky-50    text-sky-700    border-sky-100';
  return                 'bg-violet-50 text-violet-700 border-violet-100';
}

/**
 * Returns a Tailwind border-left color class.
 * blue = active (Approved–Installing), green = Complete, gray = prospect/unknown.
 */
function getBorderAccent(status) {
  const idx = PIPELINE_STATUSES.indexOf(status);
  if (idx < 0)                              return 'border-l-zinc-300';
  if (idx === PIPELINE_STATUSES.length - 1) return 'border-l-emerald-400';
  if (idx >= 2)                             return 'border-l-blue-400';
  return 'border-l-zinc-300';
}

export default function ProjectCard({ project, shipments }) {
  const totalCartons  = shipments.reduce((sum, s) => sum + s.cartons, 0);
  const receivedCount = shipments.filter((s) => s.received).length;
  const totalVendors  = shipments.length;
  const outstanding   = totalVendors - receivedCount;

  const currentIndex   = PIPELINE_STATUSES.indexOf(project.status);
  const totalStages    = PIPELINE_STATUSES.length;
  const stagesComplete = currentIndex === totalStages - 1 ? totalStages : Math.max(currentIndex, 0);

  return (
    <Link href={`/portal/${project.id}`} className="block group">
      <article
        className={`
          bg-white rounded-xl border border-zinc-200 border-l-4
          ${getBorderAccent(project.status)}
          p-6 sm:p-8 shadow-sm space-y-5
          transition-all duration-150 group-hover:shadow-lg group-hover:-translate-y-0.5
        `}
      >
        {/* Header: project code label, facility name, status pill */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono font-medium text-zinc-400 tracking-widest uppercase mb-1">
              {project.code}
            </p>
            <h2 className="text-xl font-bold text-zinc-900 leading-snug truncate">
              {project.facilityName}
            </h2>
            {project.facilityAddress && (
              <p className="text-sm text-zinc-500 mt-1 truncate">
                {project.facilityAddress}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 text-xs font-medium border px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyle(project.status)}`}
          >
            {project.status}
          </span>
        </div>

        {/* Status rail + stage count */}
        <div className="space-y-2">
          <PortalStatusRail currentStatus={project.status} />
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-zinc-700">{stagesComplete}</span>
            {' '}of {totalStages} stages complete
          </p>
        </div>

        {/* Stats row — only shown when shipments exist */}
        {totalVendors > 0 && (
          <div className="flex flex-wrap gap-6 pt-4 border-t border-zinc-100">
            <StatCell label="Cartons" value={totalCartons.toLocaleString()} />
            <StatCell label="Vendors Received" value={`${receivedCount} / ${totalVendors}`} />
            {outstanding > 0 && (
              <StatCell label="Outstanding" value={outstanding} valueClass="text-amber-600" />
            )}
          </div>
        )}

        {/* Footer: view details */}
        <div className="flex justify-end pt-1">
          <span className="text-xs font-medium text-zinc-400 group-hover:text-blue-500 transition-colors">
            View details →
          </span>
        </div>
      </article>
    </Link>
  );
}

function StatCell({ label, value, valueClass = 'text-zinc-800' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5 whitespace-nowrap">
        {label}
      </p>
      <p className={`text-base font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
