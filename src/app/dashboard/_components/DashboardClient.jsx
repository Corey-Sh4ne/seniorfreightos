'use client';
import { useState, useMemo } from 'react';
import Link          from 'next/link';
import Sidebar       from './Sidebar';
import StatCards     from './StatCards';
import FilterBar     from './FilterBar';
import ProjectsTable from './ProjectsTable';

const INACTIVE_STATUSES = ['Quote', 'Installed', 'Delivered', 'quoted', 'complete', 'invoiced'];
const DONE_STATUSES     = ['Installed', 'Delivered', 'complete', 'invoiced'];
const PIPELINE_ORDER    = ['prospect','quoted','denied','awarded','receiving','staging','scheduled','delivered','installing','complete','invoiced'];

export default function DashboardClient({ projects, viewAs = 'admin', analyticsSection = null }) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [timeFilter,   setTimeFilter]   = useState('all');

  const uniqueStatuses = useMemo(
    () => PIPELINE_ORDER.filter((s) => projects.some((p) => p.status === s)),
    [projects],
  );

  const uniqueClients = useMemo(
    () => [...new Set(projects.map((p) => p.client))].sort(),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    const timeRanges = {
      week:  new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    const cutoff = timeRanges[timeFilter];
    return projects.filter((p) => {
      const matchSearch = !q ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.facility.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchClient = clientFilter === 'All' || p.client === clientFilter;
      const matchTime   = !cutoff || (p.createdAt && new Date(p.createdAt) >= cutoff);
      return matchSearch && matchStatus && matchClient && matchTime;
    });
  }, [projects, search, statusFilter, clientFilter, timeFilter]);

  const stats = {
    active:   projects.filter((p) => !INACTIVE_STATUSES.includes(p.status)).length,
    delayed:  projects.filter((p) => p.status === 'Delayed').length,
    quotes:   projects.filter((p) => p.status === 'Quote' || p.status === 'quoted').length,
    doneWeek: projects.filter((p) => DONE_STATUSES.includes(p.status)).length,
  };

  return (
    <div className="flex h-screen bg-slate-200 overflow-hidden">
      <Sidebar viewAs={viewAs} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">FF&amp;E logistics overview</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>New Project</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <StatCards stats={stats} />
          {analyticsSection}
          <FilterBar
            search={search}             onSearch={setSearch}
            statusFilter={statusFilter} onStatusChange={setStatusFilter} statuses={uniqueStatuses}
            clientFilter={clientFilter} onClientChange={setClientFilter} clients={uniqueClients}
            timeFilter={timeFilter}     onTimeChange={setTimeFilter}
          />
          <ProjectsTable projects={filtered} />
        </main>
      </div>
    </div>
  );
}
