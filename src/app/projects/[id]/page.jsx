import { notFound, redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  getProjectById,
  getShipmentsByProjectId,
  getInstallTasksByProjectId,
  getRateCardsForQuote,
} from './_data/getProject';
import ProjectDetailClient from './_components/ProjectDetailClient';

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;

  // Read the role fresh from the Clerk API rather than the cached session token,
  // which can be stale and made the Pricing Quote tab hidden for admins.
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role ?? null;
  const isAdmin = role === 'admin';

  const [project, shipments, installTasks] = await Promise.all([
    getProjectById(id),
    getShipmentsByProjectId(id),
    getInstallTasksByProjectId(id),
  ]);

  if (!project) notFound();

  // Rate cards power the admin quote tab's selector + live recalculation. Only
  // admins ever see pricing, so skip the lookup entirely for client users.
  let rateCardData = { rateCards: [], suggestedRateCardId: null, defaultRateCardId: null };
  if (isAdmin) {
    rateCardData = await getRateCardsForQuote(project.clientName);
  }

  return (
    <ProjectDetailClient
      project={project}
      shipments={shipments}
      installTasks={installTasks}
      rateCards={rateCardData.rateCards}
      suggestedRateCardId={rateCardData.suggestedRateCardId}
      defaultRateCardId={rateCardData.defaultRateCardId}
      role={role}
    />
  );
}
