import Link from 'next/link';
import PortalStatusRail from './PortalStatusRail';
import CardProgressBar from './CardProgressBar';
import StatusPill from './StatusPill';
import StatCell from './StatCell';
import { borderAccent, toPipelineStatus, stagesComplete } from './statusConfig';
import { PIPELINE_STATUSES } from '@/utils/statusPipeline';

export default function ProjectCard({ project, shipments }) {
  const totalCartons  = shipments.reduce((sum, s) => sum + s.cartons, 0);
  const receivedCount = shipments.filter((s) => s.received).length;
  const totalVendors  = shipments.length;
  const outstanding   = totalVendors - receivedCount;

  const totalStages = PIPELINE_STATUSES.length;
  const complete    = stagesComplete(project.status);

  return (
    <Link href={`/portal/${project.id}`} className="block group">
      <article
        className={`border-l-4 ${borderAccent(project.status)} transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-lg`}
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          marginBottom: '16px',
          overflow: 'hidden',
        }}
      >
        <CardProgressBar status={project.status} />

        <div className="p-5 space-y-4">
          {/* Header: project code, facility name, status pill */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-mono font-medium text-zinc-400 tracking-widest uppercase mb-0.5">
                {project.code}
              </p>
              <h2 className="text-xl font-bold text-zinc-900 leading-snug truncate">
                {project.facilityName}
              </h2>
              {project.facilityAddress && (
                <p className="text-sm text-zinc-500 mt-0.5 truncate">
                  {project.facilityAddress}
                </p>
              )}
            </div>
            <StatusPill status={project.status} />
          </div>

          {/* Status rail — the visual centerpiece of the card */}
          <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-zinc-400 font-medium">
                Project Progress
              </span>
              <span className="text-[11px] text-zinc-500">
                <span className="font-semibold text-zinc-700">{complete}</span> of {totalStages} stages
              </span>
            </div>
            <PortalStatusRail currentStatus={toPipelineStatus(project.status)} />
          </div>

          {/* Stats + footer */}
          <div className="flex items-end justify-between gap-4">
            {totalVendors > 0 ? (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <StatCell label="Cartons" value={totalCartons.toLocaleString()} />
                <StatCell label="Vendors Received" value={`${receivedCount} / ${totalVendors}`} />
                {outstanding > 0 && (
                  <StatCell label="Outstanding" value={outstanding} valueClass="text-amber-600" />
                )}
              </div>
            ) : (
              <span />
            )}
            <span
              className="shrink-0"
              style={{
                color: '#2563EB',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View Project →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
