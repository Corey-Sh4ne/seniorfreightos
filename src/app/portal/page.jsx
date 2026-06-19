/**
 * Client Portal — project list dashboard.
 *
 * Security contract:
 *   - clientName is read exclusively from the Clerk session (sessionClaims.publicMetadata.clientName).
 *   - All DB queries filter by clientName server-side — never trusting URL params.
 *   - No pricing, rate, margin, or internal-notes data is ever fetched or rendered.
 */
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatusRail from '@/components/StatusRail';
import { getPortalProjects, getPortalShipmentsForProject } from './_data/getPortalProjects';

export default async function PortalPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const clientName = sessionClaims?.publicMetadata?.clientName;
  if (!clientName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 px-4">
        <p className="text-zinc-500 text-sm text-center max-w-sm">
          Your account is not linked to a client organization. Contact your administrator.
        </p>
      </div>
    );
  }

  const projects = await getPortalProjects(clientName);

  const shipmentArrays = await Promise.all(
    projects.map((p) => getPortalShipmentsForProject(p.id)),
  );
  const shipmentMap = Object.fromEntries(
    projects.map((p, i) => [p.id, shipmentArrays[i]]),
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">My Projects</h1>
          <span className="text-sm text-zinc-400">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {projects.length === 0 && (
          <p className="text-zinc-500 text-sm">No projects are associated with your account.</p>
        )}

        {projects.map((project) => {
          const shipments     = shipmentMap[project.id] ?? [];
          const totalCartons  = shipments.reduce((sum, s) => sum + s.cartons, 0);
          const receivedCount = shipments.filter((s) => s.received).length;
          const totalVendors  = shipments.length;
          const outstanding   = totalVendors - receivedCount;

          return (
            <Link key={project.id} href={`/portal/${project.id}`} className="block group">
              <article className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4 transition-all group-hover:border-blue-200 group-hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-zinc-400 mb-0.5">{project.code}</p>
                    <h2 className="text-base font-semibold text-zinc-900 truncate">
                      {project.facilityName}
                    </h2>
                    {project.facilityAddress && (
                      <p className="text-sm text-zinc-500 mt-0.5 truncate">{project.facilityAddress}</p>
                    )}
                  </div>

                  <div className="flex gap-5 shrink-0 text-right">
                    <StatCell
                      label="Total Cartons"
                      value={totalVendors === 0 ? '—' : totalCartons.toLocaleString()}
                    />
                    <StatCell
                      label="Vendors Received"
                      value={totalVendors === 0 ? '—' : `${receivedCount} / ${totalVendors}`}
                    />
                    {outstanding > 0 && (
                      <StatCell label="Outstanding" value={outstanding} className="text-amber-500" />
                    )}
                  </div>
                </div>

                <StatusRail currentStatus={project.status} />
              </article>
            </Link>
          );
        })}
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
