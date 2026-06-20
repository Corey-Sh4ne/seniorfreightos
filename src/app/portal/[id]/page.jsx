/**
 * Client Portal — single project status view.
 *
 * Security contract:
 *   - User must be authenticated via Clerk.
 *   - No pricing, rate, margin, or internal-notes data is fetched or rendered.
 */
export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ProjectHero from './_components/ProjectHero';
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

  // Read role and clientName fresh from the Clerk API. Session claims are cached
  // and can be stale, which previously broke client scoping.
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role ?? null;
  const clientName = user.publicMetadata?.clientName ?? null;
  const isAdmin = role === 'admin';

  // Admins can view any project; client users are scoped to their own
  // organization, so the lookup is filtered by client_name.
  const project = await getPortalProjectById(id, isAdmin ? null : clientName);
  if (!project) {
    // A client user requesting a project that isn't theirs gets sent back to
    // their portal rather than leaking the project's existence via a 404.
    if (!isAdmin) redirect('/portal');
    notFound();
  }

  // This page only shows active projects. A quote (quoted/denied) is reviewed on
  // the dedicated quote page; a prospect is never client-visible.
  if (project.status === 'quoted' || project.status === 'denied') {
    redirect(`/portal/quotes/${project.id}`);
  }
  if (project.status === 'prospect') redirect('/portal');

  const [shipments, installTasks] = await Promise.all([
    getPortalProjectShipments(project.id),
    getPortalProjectInstallTasks(project.id),
  ]);

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
        <ProjectHero project={project} clientName={clientName} />

        <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
          <PortalDetailTabs shipments={shipments} installTasks={installTasks} />
        </section>
      </main>
    </div>
  );
}
