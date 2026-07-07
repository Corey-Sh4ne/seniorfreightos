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
import Link from 'next/link';
import ProjectHero from './_components/ProjectHero';
import PortalDetailTabs from './_components/PortalDetailTabs';
import StageNotes from './_components/StageNotes';
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
      <header
        style={{
          background: '#1F3864',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              SENIORFREIGHTOS
            </p>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.2,
                marginTop: '4px',
              }}
            >
              Client Portal
            </h1>
          </div>
        </div>
        <Link
          href={returnTo}
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          ← My Projects
        </Link>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px' }}>
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
