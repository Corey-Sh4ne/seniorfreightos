import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import jwt from 'jsonwebtoken';
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

/**
 * Decode the `token` cookie to extract the user role.
 * Returns null when no valid token is present.
 */
async function getUserRole() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token || !process.env.JWT_SECRET) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.role ?? null;
  } catch {
    return null;
  }
}

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;

  const role = await getUserRole();
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
      isAdmin={isAdmin}
    />
  );
}
