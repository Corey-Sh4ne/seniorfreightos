'use client';
import { useState, useMemo } from 'react';
import { MOCK_PROJECTS } from './_data/mockProjects';
import Sidebar       from './_components/Sidebar';
import StatCards     from './_components/StatCards';
import FilterBar     from './_components/FilterBar';
import ProjectsTable from './_components/ProjectsTable';

const UNIQUE_STATUSES = [...new Set(MOCK_PROJECTS.map((p) => p.status))].sort();
const UNIQUE_CLIENTS  = [...new Set(MOCK_PROJECTS.map((p) => p.client))].sort();

export default function DashboardPage() {
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [clientFilter,  setClientFilter]  = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_PROJECTS.filter((p) => {
      const matchSearch = !q ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.facility.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchClient = clientFilter === 'All' || p.client === clientFilter;
      return matchSearch && matchStatus && matchClient;
    });
  }, [search, statusFilter, clientFilter]);

  const stats = {
    active:   MOCK_PROJECTS.filter((p) => !['Quote', 'Installed', 'Delivered'].includes(p.status)).length,
    delayed:  MOCK_PROJECTS.filter((p) => p.status === 'Delayed').length,
    quotes:   MOCK_PROJECTS.filter((p) => p.status === 'Quote').length,
    doneWeek: MOCK_PROJECTS.filter((p) => ['Installed', 'Delivered'].includes(p.status)).length,
  };

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 leading-tight">Dashboard</h1>
            <p className="text-xs text-zinc-400 mt-0.5">FF&amp;E logistics overview</p>
          </div>
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
            <span className="text-base leading-none">+</span>
            <span>New Project</span>
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <StatCards stats={stats} />
          <FilterBar
            search={search}           onSearch={setSearch}
            statusFilter={statusFilter} onStatusChange={setStatusFilter} statuses={UNIQUE_STATUSES}
            clientFilter={clientFilter} onClientChange={setClientFilter} clients={UNIQUE_CLIENTS}
          />
          <ProjectsTable projects={filtered} />
        </main>
      </div>
    </div>
  );
}
