import PortalHeader from '@/app/portal/_components/PortalHeader';
import ProjectCard  from '@/app/portal/_components/ProjectCard';
import EmptyState   from '@/app/portal/_components/EmptyState';

/**
 * Renders the client portal experience inline for the admin "View as Client"
 * preview. Reuses the existing portal components; the parent is responsible for
 * passing projects already scoped to a single clientName.
 */
export default function PortalClient({ projects, shipmentMap }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <PortalHeader projectCount={projects.length} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              shipments={shipmentMap[project.id] ?? []}
            />
          ))
        )}
      </main>
    </div>
  );
}
