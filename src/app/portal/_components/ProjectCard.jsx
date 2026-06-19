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
      <article className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm space-y-5 transition-all duration-150 group-hover:border-blue-300 group-hover:shadow-md group-hover:-translate-y-px">

        {/* Header row: identity + status pill */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono font-medium text-zinc-400 tracking-wider mb-0.5">
              {project.code}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 truncate leading-snug">
              {project.facilityName}
            </h2>
            {project.facilityAddress && (
              <p className="text-sm text-zinc-500 mt-0.5 truncate">
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

        {/* Progress + segmented rail */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              <span className="font-semibold text-zinc-600">{stagesComplete}</span> of {totalStages} stages complete
            </p>
            <span className="text-xs text-zinc-400 group-hover:text-blue-500 transition-colors">
              View details →
            </span>
          </div>
          <PortalStatusRail currentStatus={project.status} />
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
