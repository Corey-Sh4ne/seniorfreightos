export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getPortalProjects, getPortalShipmentsForProject } from './_data/getPortalProjects';
import PortalHeader from './_components/PortalHeader';
import ProjectCard  from './_components/ProjectCard';
import EmptyState   from './_components/EmptyState';

export default async function PortalPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const projects = await getPortalProjects();

  const shipmentArrays = await Promise.all(
    projects.map((p) => getPortalShipmentsForProject(p.id)),
  );
  const shipmentMap = Object.fromEntries(
    projects.map((p, i) => [p.id, shipmentArrays[i]]),
  );

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
