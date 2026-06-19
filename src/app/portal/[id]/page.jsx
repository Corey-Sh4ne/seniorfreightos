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

  const project = await getPortalProjectById(id);
  if (!project) notFound();

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
        <ProjectHero project={project} />

        <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
          <PortalDetailTabs shipments={shipments} installTasks={installTasks} />
        </section>
      </main>
    </div>
  );
}
