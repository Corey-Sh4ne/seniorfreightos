export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';

import { getProjects }     from './_data/getProjects';
import { getOpsBoardData } from './_data/getOpsBoardData';
import {
  getPortalProjects,
  getPortalShipmentsForProject,
} from '@/app/portal/_data/getPortalProjects';
import { getCurrentRole } from '@/app/ops/_lib/auth';
import { parseClientName } from './_lib/viewAsOptions';

import DashboardClient   from './_components/DashboardClient';
import ImpersonationView from './_components/ImpersonationView';
import PortalClient      from './_components/PortalClient';
import OpsClient         from '@/app/ops/_components/OpsClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const rawViewAs = cookieStore.get('viewAs')?.value ?? '';

  // Only admins may impersonate another view; for everyone else the cookie is
  // ignored entirely (enforced server-side, never UI-only).
  const { role } = await getCurrentRole();
  const viewAs = role === 'admin' ? rawViewAs : '';

  // "View as Dispatcher" — render the ops board inline.
  if (viewAs === 'dispatcher') {
    const projects = await getOpsBoardData();
    return (
      <ImpersonationView viewAs={viewAs}>
        <OpsClient projects={projects} role="dispatcher" />
      </ImpersonationView>
    );
  }

  // "View as Client — <Name>" — render the portal scoped to that clientName.
  const clientName = parseClientName(viewAs);
  if (clientName) {
    const projects = await getPortalProjects(clientName);
    const shipmentArrays = await Promise.all(
      projects.map((p) => getPortalShipmentsForProject(p.id)),
    );
    const shipmentMap = Object.fromEntries(
      projects.map((p, i) => [p.id, shipmentArrays[i]]),
    );
    return (
      <ImpersonationView viewAs={viewAs}>
        <PortalClient projects={projects} shipmentMap={shipmentMap} />
      </ImpersonationView>
    );
  }

  // Default: normal admin dashboard.
  const projects = await getProjects();
  return <DashboardClient projects={projects} viewAs="admin" />;
}
