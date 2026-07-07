/**
 * Client Portal — quote review & response page.
 *
 * Security contract:
 *   - User must be authenticated via Clerk.
 *   - Client users only see quotes for their own organization (scoped by
 *     client_name inside getPortalProjectById).
 *   - Admins viewing-as a client are scoped to that client just like a real
 *     client_user, and get to use Accept/Deny on behalf of the client. The
 *     viewAs cookie is only writeable via the admin-only setViewAs action;
 *     we also gate by role here as defense in depth.
 *   - Only the client-facing itemized quote (quoted_price) is exposed — never
 *     internal rates, margin, or overhead inputs.
 */
export const dynamic = 'force-dynamic';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import QuoteBreakdown from '@/components/QuoteBreakdown';
import PortalHeader from '@/app/portal/_components/PortalHeader';
import { getPortalProjectById } from '@/app/portal/[id]/_data/getPortalProject';
import { parseClientName } from '@/app/dashboard/_lib/viewAsOptions';
import ImpersonationView from '@/app/dashboard/_components/ImpersonationView';
import QuoteResponse from './_components/QuoteResponse';

export default async function PortalQuotePage({ params }) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role ?? null;
  const clientName = user.publicMetadata?.clientName ?? null;
  const isAdmin = role === 'admin';

  // Honor the admin "View As Client — <Name>" cookie so impersonating admins
  // get the exact same scope (and Accept/Deny) as a real client_user.
  const cookieStore = await cookies();
  const rawViewAs = isAdmin ? (cookieStore.get('viewAs')?.value ?? '') : '';
  const impersonatedClientName = parseClientName(rawViewAs);

  const effectiveClientName = impersonatedClientName ?? clientName;
  // Admin without impersonation can read any quote (preview); everyone else —
  // real client_user OR impersonating admin — is scoped to their effective client.
  const scope = isAdmin && !impersonatedClientName ? null : effectiveClientName;

  const returnTo = impersonatedClientName ? '/dashboard' : '/portal';

  const project = await getPortalProjectById(id, scope);
  if (!project) redirect(returnTo);

  // Route by status: prospect is never client-visible; awarded and beyond are
  // active projects that belong on the project detail page; only quoted/denied
  // are reviewable quotes.
  if (project.status === 'prospect') redirect(returnTo);
  if (project.status !== 'quoted' && project.status !== 'denied') {
    redirect(`/portal/${project.id}`);
  }

  const denied = project.status === 'denied';
  // Buttons appear whenever there's an effective client to act as. Bare admin
  // (no impersonation) gets the read-only preview.
  const canRespond = !!effectiveClientName;

  const cardStyle = {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    padding: '24px',
    marginBottom: '16px',
  };

  const content = (
    <div style={{ background: '#F3F4F6', minHeight: '100vh' }}>
      <PortalHeader backHref={returnTo} />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
        <section style={cardStyle}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            Quote Review
          </p>
          <p className="text-xs font-mono font-medium text-zinc-400 tracking-[0.18em] uppercase mb-2">
            {project.code}
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 leading-tight tracking-tight">
            {project.facilityName}
          </h2>
          {project.clientName && (
            <p className="text-sm text-zinc-500 mt-1">{project.clientName}</p>
          )}
        </section>

        <section style={cardStyle}>
          <h3 className="text-lg font-bold text-zinc-900 mb-1">Your Quote</h3>
          <p className="text-sm text-zinc-500 mb-5">
            Review the itemized breakdown below before responding.
          </p>

          {project.quotedPrice ? (
            <QuoteBreakdown breakdown={project.quotedPrice} theme="light" />
          ) : (
            <p className="text-sm text-zinc-500">This quote is being prepared. Please check back soon.</p>
          )}
        </section>

        {denied ? (
          <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-5 py-4">
            <p className="text-sm font-medium text-zinc-500">
              You denied this quote. We&apos;ll follow up with a revised quote shortly.
            </p>
          </div>
        ) : (
          canRespond && project.quotedPrice && (
            <QuoteResponse
              projectId={project.id}
              clientName={effectiveClientName}
              returnTo={returnTo}
            />
          )
        )}
      </main>
    </div>
  );

  // Wrap in the dashboard impersonation shell so the admin keeps the sidebar
  // (with View As switcher) and the impersonation banner while reviewing.
  if (impersonatedClientName) {
    return <ImpersonationView viewAs={rawViewAs}>{content}</ImpersonationView>;
  }
  return content;
}
