import PortalHeader from '@/app/portal/_components/PortalHeader';
import ProjectCard  from '@/app/portal/_components/ProjectCard';
import QuoteCard    from '@/app/portal/_components/QuoteCard';
import EmptyState   from '@/app/portal/_components/EmptyState';

/**
 * Renders the client portal experience inline for the admin "View as Client"
 * preview. Reuses the existing portal components; the parent is responsible for
 * passing quotes and projects already scoped to a single clientName.
 */
export default function PortalClient({ quotes = [], projects, shipmentMap }) {
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
