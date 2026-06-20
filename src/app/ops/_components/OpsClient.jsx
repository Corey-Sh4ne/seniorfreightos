'use client';

import OpsProjectCard from './OpsProjectCard';

// Completed = finished work (complete / invoiced). Everything else is still
// moving through the pipeline and needs dispatcher action.
const COMPLETED_STATUSES = new Set(['complete', 'invoiced']);

const ROLE_LABELS = {
  admin: 'Admin',
  dispatcher: 'Dispatcher',
  install_crew_lead: 'Warehouse / Crew Lead',
};

export default function OpsClient({ projects, role }) {
  const active = projects.filter((p) => !COMPLETED_STATUSES.has(p.status));
  const completed = projects.filter((p) => COMPLETED_STATUSES.has(p.status));

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Order Management</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {active.length} active {active.length === 1 ? 'project' : 'projects'} in the pipeline
            </p>
          </div>
          {role && (
            <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {active.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">No active projects right now.</p>
          </div>
        ) : (
          <ul className="space-y-5">
            {active.map((project) => (
              <li key={project.id}>
                <OpsProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <section className="mt-10 rounded-xl bg-zinc-100 p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Completed Projects
              </h2>
              <span className="text-xs text-zinc-400">
                {completed.length} {completed.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <ul className="space-y-5">
              {completed.map((project) => (
                <li key={project.id}>
                  <OpsProjectCard project={project} completed />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
