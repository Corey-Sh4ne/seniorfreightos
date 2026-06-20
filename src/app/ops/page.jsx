export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { query } from '@/db/index';
import { requireOpsRole } from './_lib/auth';
import OpsClient from './_components/OpsClient';

export const metadata = {
  title: 'Order Management — SeniorFreightOS',
};

/**
 * Order Management System — dispatcher / warehouse staff workspace.
 * Fetches every project plus its shipments and install tasks, groups them, and
 * hands them to the client component (which surfaces only active projects).
 */
export default async function OpsPage() {
  const access = await requireOpsRole();
  if (access.reason === 'unauthenticated') redirect('/sign-in');
  if (!access.ok) {
    return (
      <main className="min-h-screen grid place-items-center bg-zinc-50 px-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Access restricted</h1>
          <p className="mt-1 text-sm text-zinc-500">
            The Order Management System is available to dispatch and warehouse staff only.
          </p>
        </div>
      </main>
    );
  }

  const { rows: projects } = await query(
    `SELECT id, code, client_name, facility_name, status
       FROM projects
   ORDER BY created_at DESC`,
  );

  const projectIds = projects.map((p) => p.id);

  let shipments = [];
  let tasks = [];
  if (projectIds.length) {
    ({ rows: shipments } = await query(
      `SELECT id, project_id, vendor, category, qty, received
         FROM shipments
        WHERE project_id = ANY($1)
     ORDER BY vendor`,
      [projectIds],
    ));
    ({ rows: tasks } = await query(
      `SELECT id, project_id, type, qty, completed
         FROM install_tasks
        WHERE project_id = ANY($1)
     ORDER BY type`,
      [projectIds],
    ));
  }

  const data = projects.map((p) => ({
    id: p.id,
    code: p.code,
    clientName: p.client_name,
    facilityName: p.facility_name,
    status: p.status,
    shipments: shipments
      .filter((s) => s.project_id === p.id)
      .map((s) => ({
        id: s.id,
        vendor: s.vendor,
        category: s.category,
        qty: Number(s.qty),
        received: s.received,
      })),
    installTasks: tasks
      .filter((t) => t.project_id === p.id)
      .map((t) => ({
        id: t.id,
        type: t.type,
        qty: Number(t.qty),
        completed: t.completed,
      })),
  }));

  return <OpsClient projects={data} role={access.role} />;
}
