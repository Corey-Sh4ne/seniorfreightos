export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  getPortalProjects,
  getPortalQuotes,
  getPortalShipmentsForProject,
} from './_data/getPortalProjects';
import PortalHeader from './_components/PortalHeader';
import ProjectCard from './_components/ProjectCard';
import QuoteCard from './_components/QuoteCard';
import EmptyState from './_components/EmptyState';

export default async function PortalPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Read role and clientName fresh from the Clerk API. Session claims are cached
  // and can be stale, which previously broke client scoping.
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role ?? null;
  const clientName = user.publicMetadata?.clientName ?? null;
  const scope = role === 'admin' ? null : clientName;

  // Admins see every project; client users are scoped to their own organization.
  const [quotes, projects] = await Promise.all([
    getPortalQuotes(scope),
    getPortalProjects(scope),
  ]);

  const shipmentArrays = await Promise.all(
    projects.map((p) => getPortalShipmentsForProject(p.id)),
  );
  const shipmentMap = Object.fromEntries(
    projects.map((p, i) => [p.id, shipmentArrays[i]]),
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <PortalHeader projectCount={projects.length} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {quotes.length > 0 && (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Pending Quotes
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review and respond to quotes awaiting your decision.
              </p>
            </div>
            <div className="space-y-3">
              {quotes.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Your Projects
          </h2>
          {projects.length === 0 ? (
            quotes.length === 0 ? (
              <EmptyState />
            ) : (
              <p className="text-sm text-zinc-400">
                No active projects yet — your pending quotes are listed above.
              </p>
            )
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  shipments={shipmentMap[project.id] ?? []}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
