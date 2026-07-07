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
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>
      <div
        style={{
          background: '#1F3864',
          padding: '24px 32px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: 0 }}>
            Order Management
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            {active.length} active {active.length === 1 ? 'project' : 'projects'} in the pipeline
          </p>
        </div>
        <span
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {ROLE_LABELS[role] ?? role ?? 'Dispatcher'}
        </span>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {active.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">No active projects right now.</p>
          </div>
        ) : (
          <ul>
            {active.map((project) => (
              <li key={project.id}>
                <OpsProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between">
              <h2
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                  marginTop: '24px',
                }}
              >
                Completed Projects
              </h2>
              <span className="text-xs text-zinc-400">
                {completed.length} {completed.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <ul>
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
