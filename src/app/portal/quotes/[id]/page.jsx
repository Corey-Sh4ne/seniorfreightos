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
import Link from 'next/link';
import QuoteBreakdown from '@/components/QuoteBreakdown';
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

  const content = (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
              <h1 className="text-base font-semibold text-zinc-900 leading-tight mt-0.5">Quote Review</h1>
            </div>
          </div>
          <Link href={returnTo} className="text-sm font-medium text-zinc-500 hover:text-blue-600 transition-colors">
            ← My Projects
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-xs font-mono font-medium text-zinc-400 tracking-[0.18em] uppercase mb-2">
            {project.code}
          </p>
          <h2 className="text-3xl font-bold text-zinc-900 leading-tight tracking-tight">
            {project.facilityName}
          </h2>
          {project.clientName && (
            <p className="text-sm text-zinc-500 mt-1">{project.clientName}</p>
          )}
        </div>

        <section className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
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
