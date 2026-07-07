import PortalStatusRail from '@/app/portal/_components/PortalStatusRail';
import CardProgressBar from '@/app/portal/_components/CardProgressBar';
import StatusPill from '@/app/portal/_components/StatusPill';
import StatCell from '@/app/portal/_components/StatCell';
import { toPipelineStatus, stagesComplete } from '@/app/portal/_components/statusConfig';
import { PIPELINE_STATUSES } from '@/utils/statusPipeline';
import QuotePanel from './QuotePanel';

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectHero({ project, clientName }) {
  const totalStages = PIPELINE_STATUSES.length;
  const complete    = stagesComplete(project.status);

  return (
    <>
    <article
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        marginBottom: '16px',
        overflow: 'hidden',
        borderLeft: '4px solid #2563EB',
      }}
    >
      <CardProgressBar status={project.status} />

      <div className="p-6 sm:p-8 space-y-7">
        {/* Identity */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono font-medium text-zinc-400 tracking-[0.18em] uppercase mb-2">
              {project.code}
            </p>
            <h2 className="text-3xl font-bold text-zinc-900 leading-tight tracking-tight">
              {project.facilityName}
            </h2>
            {project.facilityAddress && (
              <p className="text-sm text-zinc-500 mt-2">{project.facilityAddress}</p>
            )}
            {project.contactName && (
              <p className="text-sm text-zinc-500 mt-1">
                Contact:{' '}
                <span className="text-zinc-700 font-medium">{project.contactName}</span>
                {project.contactEmail && (
                  <a href={`mailto:${project.contactEmail}`} className="ml-2 text-blue-600 hover:underline">
                    {project.contactEmail}
                  </a>
                )}
              </p>
            )}
          </div>
          <StatusPill status={project.status} className="text-sm px-3.5 py-1.5" />
        </div>

        {/* Progress rail — prominent, above the stats row */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">
              Project Progress
            </span>
            <span className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-800">{complete}</span> of {totalStages} stages complete
            </span>
          </div>
          <PortalStatusRail currentStatus={toPipelineStatus(project.status)} />
        </div>

        {/* Key facts */}
        <div className="flex flex-wrap gap-x-10 gap-y-4 pt-6 border-t border-zinc-100">
          <StatCell
            label="Rush Delivery"
            value={project.rushDelivery ? 'Yes' : 'No'}
            valueClass={project.rushDelivery ? 'text-amber-600' : 'text-zinc-800'}
          />
          <StatCell
            label="Storage Days"
            value={project.storageDays > 0 ? `${project.storageDays}d` : '—'}
          />
          <StatCell label="Start Date" value={formatDate(project.createdAt)} />
        </div>
      </div>
    </article>

    <QuotePanel project={project} clientName={clientName} />
    </>
  );
}
