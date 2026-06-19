/**
 * Client Portal — single project status view.
 *
 * Security contract:
 *   - User must be authenticated via Clerk.
 *   - No pricing, rate, margin, or internal-notes data is fetched or rendered.
 */
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { PIPELINE_STATUSES } from '@/utils/statusPipeline';
import PortalStatusRail from '@/app/portal/_components/PortalStatusRail';
import PortalDetailTabs from './_components/PortalDetailTabs';
import {
  getPortalProjectById,
  getPortalProjectShipments,
  getPortalProjectInstallTasks,
} from './_data/getPortalProject';

function statusStyle(status) {
  const idx = PIPELINE_STATUSES.indexOf(status);
  if (idx < 0)                              return 'bg-zinc-100 text-zinc-500 border-zinc-200';
  if (idx === PIPELINE_STATUSES.length - 1) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (idx >= 6) return 'bg-blue-50 text-blue-700 border-blue-100';
  if (idx >= 4) return 'bg-amber-50 text-amber-700 border-amber-100';
  if (idx >= 2) return 'bg-sky-50 text-sky-700 border-sky-100';
  return 'bg-violet-50 text-violet-700 border-violet-100';
}

function getBorderAccent(status) {
  const idx = PIPELINE_STATUSES.indexOf(status);
  if (idx < 0)                              return 'border-l-zinc-300';
  if (idx === PIPELINE_STATUSES.length - 1) return 'border-l-emerald-400';
  if (idx >= 2)                             return 'border-l-blue-400';
  return 'border-l-zinc-300';
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function PortalProjectPage({ params }) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const project = await getPortalProjectById(id);
  if (!project) notFound();

  const [shipments, installTasks] = await Promise.all([
    getPortalProjectShipments(project.id),
    getPortalProjectInstallTasks(project.id),
  ]);

  const currentIdx     = PIPELINE_STATUSES.indexOf(project.status);
  const totalStages    = PIPELINE_STATUSES.length;
  const stagesComplete = currentIdx === totalStages - 1 ? totalStages : Math.max(currentIdx, 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.12em] leading-none">
                SeniorFreightOS
              </p>
              <h1 className="text-base font-semibold text-zinc-900 leading-tight mt-0.5">Client Portal</h1>
            </div>
          </div>
          <Link
            href="/portal"
            className="text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors"
          >
            ← My Projects
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Project hero card */}
        <article
          className={`bg-white rounded-xl border border-zinc-200 border-l-4 ${getBorderAccent(project.status)} p-6 sm:p-8 shadow-sm space-y-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-mono font-medium text-zinc-400 tracking-widest uppercase mb-1">
                {project.code}
              </p>
              <h2 className="text-2xl font-bold text-zinc-900 leading-snug">{project.facilityName}</h2>
              {project.facilityAddress && (
                <p className="text-sm text-zinc-500 mt-1">{project.facilityAddress}</p>
              )}
              {project.contactName && (
                <p className="text-sm text-zinc-500 mt-0.5">
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
            <span
              className={`shrink-0 text-xs font-medium border px-3 py-1.5 rounded-full whitespace-nowrap ${statusStyle(project.status)}`}
            >
              {project.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 pt-5 border-t border-zinc-100">
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

          <div className="space-y-2">
            <PortalStatusRail currentStatus={project.status} />
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-700">{stagesComplete}</span>
              {' '}of {totalStages} stages complete
            </p>
          </div>
        </article>

        {/* Detail tabs */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
          <PortalDetailTabs shipments={shipments} installTasks={installTasks} />
        </section>
      </main>
    </div>
  );
}

function StatCell({ label, value, valueClass = 'text-zinc-800' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5 whitespace-nowrap">{label}</p>
      <p className={`text-base font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
