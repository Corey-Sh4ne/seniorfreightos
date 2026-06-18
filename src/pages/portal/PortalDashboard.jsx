import { useState, useEffect } from 'react';
import StatusRail from '../../components/StatusRail';

/**
 * Read-only dashboard for client_user role.
 *
 * Data contract (enforced server-side by /api/portal):
 *   - Results are pre-filtered to the authenticated client's organization.
 *   - Pricing, margin, rate card, and internal notes are never returned.
 *   - No write operations are available.
 */
export default function PortalDashboard() {
  const [projects, setProjects]     = useState([]);
  const [shipmentMap, setShipmentMap] = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portal/projects');
        if (!res.ok) throw new Error('Could not load projects.');
        const data = await res.json();
        setProjects(data);

        // Fetch shipments for every project concurrently to build summary stats.
        const pairs = await Promise.all(
          data.map(async (project) => {
            const sRes = await fetch(`/api/portal/projects/${project.id}/shipments`);
            if (!sRes.ok) return [project.id, []];
            return [project.id, await sRes.json()];
          }),
        );
        setShipmentMap(Object.fromEntries(pairs));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <p className="text-zinc-400 text-sm animate-pulse">Loading your projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">My Projects</h1>
          <span className="text-sm text-zinc-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {projects.length === 0 && (
          <p className="text-zinc-500 text-sm">No projects are associated with your account.</p>
        )}

        {projects.map((project) => {
          const shipments      = shipmentMap[project.id] ?? [];
          const totalCartons   = shipments.reduce((sum, s) => sum + (s.cartons ?? 0), 0);
          const receivedCount  = shipments.filter((s) => s.received).length;
          const totalVendors   = shipments.length;
          const outstanding    = totalVendors - receivedCount;

          return (
            <article
              key={project.id}
              className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4"
            >
              {/* Project header row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-zinc-400 mb-0.5">{project.code}</p>
                  <h2 className="text-base font-semibold text-zinc-900 truncate">
                    {project.facility_name}
                  </h2>
                  {project.facility_address && (
                    <p className="text-sm text-zinc-500 mt-0.5 truncate">{project.facility_address}</p>
                  )}
                </div>

                {/* Summary stats — no pricing, margin, or rate fields */}
                <div className="flex gap-5 shrink-0 text-right">
                  <StatCell
                    label="Total Cartons"
                    value={shipments.length === 0 ? '—' : totalCartons.toLocaleString()}
                  />
                  <StatCell
                    label="Vendors Received"
                    value={
                      totalVendors === 0
                        ? '—'
                        : `${receivedCount} / ${totalVendors}`
                    }
                    highlight={false}
                  />
                  {outstanding > 0 && (
                    <StatCell
                      label="Outstanding"
                      value={outstanding}
                      className="text-amber-500"
                    />
                  )}
                </div>
              </div>

              {/* Pipeline progress rail */}
              <StatusRail currentStatus={project.status} />
            </article>
          );
        })}
      </main>
    </div>
  );
}

function StatCell({ label, value, className = 'text-zinc-800' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 whitespace-nowrap">{label}</p>
      <p className={`text-lg font-semibold ${className}`}>{value}</p>
    </div>
  );
}
