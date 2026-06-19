/**
 * Client Portal — single project status view.
 *
 * Security contract:
 *   - Project is fetched with a WHERE client_name = $clientName clause.
 *   - clientName comes only from Clerk's API, never from the URL.
 *   - No pricing, rate, margin, or internal-notes data is fetched or rendered.
 */
export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import StatusRail from '@/components/StatusRail';
import PortalDetailTabs from './_components/PortalDetailTabs';
import {
  getPortalProjectById,
  getPortalProjectShipments,
  getPortalProjectInstallTasks,
} from './_data/getPortalProject';

export default async function PortalProjectPage({ params }) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await clerkClient.users.getUser(userId);
  const clientName = user.publicMetadata?.clientName;
  if (!clientName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 px-4">
        <p className="text-zinc-500 text-sm text-center max-w-sm">
          Your account is not linked to a client organization. Contact your administrator.
        </p>
      </div>
    );
  }

  const project = await getPortalProjectById(id, clientName);
  if (!project) notFound();

  const [shipments, installTasks] = await Promise.all([
    getPortalProjectShipments(project.id),
    getPortalProjectInstallTasks(project.id),
  ]);

  const totalCartons  = shipments.reduce((sum, s) => sum + s.cartons, 0);
  const receivedCount = shipments.filter((s) => s.received).length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/portal"
            className="shrink-0 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            ← Back
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-zinc-400">{project.code}</p>
            <h1 className="text-xl font-semibold text-zinc-900 truncate">{project.facilityName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Project overview */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              {project.facilityAddress && (
                <p className="text-sm text-zinc-500">{project.facilityAddress}</p>
              )}
              {project.contactName && (
                <p className="text-sm text-zinc-500">
                  Contact:{' '}
                  <span className="text-zinc-700 font-medium">{project.contactName}</span>
                  {project.contactEmail && (
                    <a
                      href={`mailto:${project.contactEmail}`}
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {project.contactEmail}
                    </a>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-5 shrink-0 text-right">
              <StatCell
                label="Total Cartons"
                value={shipments.length === 0 ? '—' : totalCartons.toLocaleString()}
              />
              <StatCell
                label="Vendors Received"
                value={shipments.length === 0 ? '—' : `${receivedCount} / ${shipments.length}`}
              />
              {project.rushDelivery && (
                <StatCell label="Rush" value="Yes" className="text-amber-600" />
              )}
            </div>
          </div>

          <StatusRail currentStatus={project.status} />
        </section>

        {/* Shipments / Install Tasks — tab toggle handled by Client Component */}
        <section className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <PortalDetailTabs shipments={shipments} installTasks={installTasks} />
        </section>
      </main>
    </div>
  );
}

function StatCell({ label, value, className = 'text-zinc-800' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 whitespace-nowrap">{label}</p>
      <p className={`text-lg font-semibold ${className}`}>{value}</p>
    </div>
  );
}
