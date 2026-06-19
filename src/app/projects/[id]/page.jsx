import { notFound, redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { calculateProjectPricing } from '@/utils/pricingEngine';
import { getProjectById, getShipmentsByProjectId, getInstallTasksByProjectId } from './_data/getProject';
import ProjectDetailClient from './_components/ProjectDetailClient';

/**
 * DB install task types → pricingEngine task types.
 * The migration schema uses shorthand keys; pricingEngine uses full keys.
 */
const TASK_TYPE_MAP = {
  assemble:     'assemble_furniture',
  hang_art:     'hang_artwork',
  mount_tv:     'mount_tv_fixture',
  place:        'place_and_position',
  debris:       'debris_removal',
  window_treat: 'install_window_treatments',
};

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

  // Compute pricing for admin only, and only if the rate card snapshot is present.
  let pricing = null;
  if (isAdmin) {
    const rates = project.rates ?? {};
    const hasRates = rates.receivingPerLb != null && rates.freightPerLb != null;
    if (hasRates) {
      try {
        const mappedTasks = installTasks.map((t) => ({
          ...t,
          type: TASK_TYPE_MAP[t.type] ?? t.type,
        }));
        pricing = calculateProjectPricing(project, shipments, mappedTasks);
      } catch {
        // Rate card snapshot is incomplete — leave pricing as null
      }
    }
  }

  return (
    <ProjectDetailClient
      project={project}
      shipments={shipments}
      installTasks={installTasks}
      pricing={pricing}
      role={role}
    />
  );
}
