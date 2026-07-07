/**
 * Client Portal — single project status view.
 *
 * Security contract:
 *   - User must be authenticated via Clerk.
 *   - No pricing, rate, margin, or internal-notes data is fetched or rendered.
 */
export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import ProjectHero from './_components/ProjectHero';
import PortalDetailTabs from './_components/PortalDetailTabs';
import StageNotes from './_components/StageNotes';
import PortalHeader from '@/app/portal/_components/PortalHeader';
import { parseClientName } from '@/app/dashboard/_lib/viewAsOptions';
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

  // Honor the admin "View As Client — <Name>" cookie so the back link returns
  // to the dashboard impersonation shell rather than bouncing out of it.
  const cookieStore = await cookies();
  const rawViewAs = isAdmin ? (cookieStore.get('viewAs')?.value ?? '') : '';
  const impersonatedClientName = parseClientName(rawViewAs);
  const returnTo = impersonatedClientName ? '/dashboard' : '/portal';

  // Admins can view any project; client users are scoped to their own
  // organization, so the lookup is filtered by client_name.
  const project = await getPortalProjectById(id, isAdmin ? null : clientName);
  if (!project) {
    // A client user requesting a project that isn't theirs gets sent back to
    // their portal rather than leaking the project's existence via a 404.
    if (!isAdmin) redirect(returnTo);
    notFound();
  }

  // This page only shows active projects. A quote (quoted/denied) is reviewed on
  // the dedicated quote page; a prospect is never client-visible.
  if (project.status === 'quoted' || project.status === 'denied') {
    redirect(`/portal/quotes/${project.id}`);
  }
  if (project.status === 'prospect') redirect(returnTo);

  const [shipments, installTasks] = await Promise.all([
    getPortalProjectShipments(project.id),
    getPortalProjectInstallTasks(project.id),
  ]);

  return (
    <div style={{ background: '#F3F4F6', minHeight: '100vh' }}>
      <PortalHeader backHref={returnTo} />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
        <ProjectHero project={project} clientName={clientName} />

        <StageNotes stageNotes={project.stageNotes} />

        <section
          style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <PortalDetailTabs shipments={shipments} installTasks={installTasks} />
        </section>
      </main>
    </div>
  );
}
