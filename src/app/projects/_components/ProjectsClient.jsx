'use client';

import { useState, useMemo } from 'react';
import Link            from 'next/link';
import Sidebar         from '@/app/dashboard/_components/Sidebar';
import FilterBar       from '@/app/dashboard/_components/FilterBar';
import ProjectsTable   from '@/app/dashboard/_components/ProjectsTable';
import { PIPELINE_STATUSES } from '@/utils/statusPipeline';
import { toPipelineStatus }  from '@/app/portal/_components/statusConfig';

function timeThreshold(value) {
  if (value === 'all') return null;
  const now = new Date();
  if (value === 'week')  return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  if (value === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (value === '30d')   return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export default function ProjectsClient({ projects }) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [timeFilter,   setTimeFilter]   = useState('all');

  const uniqueClients = useMemo(
    () => [...new Set(projects.map((p) => p.client))].sort(),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const threshold = timeThreshold(timeFilter);
    return projects.filter((p) => {
      const matchSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.facility.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'All' || toPipelineStatus(p.status) === statusFilter;
      const matchClient = clientFilter === 'All' || p.client === clientFilter;
      const matchTime   =
        !threshold || (p.createdAt && new Date(p.createdAt) >= threshold);
      return matchSearch && matchStatus && matchClient && matchTime;
    });
  }, [projects, search, statusFilter, clientFilter, timeFilter]);

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 leading-tight">Projects</h1>
            <p className="text-xs text-zinc-400 mt-0.5">All active and historical projects</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                       text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <span className="text-base leading-none">+</span>
            <span>New Project</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <FilterBar
            search={search}             onSearch={setSearch}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
            statuses={PIPELINE_STATUSES}
            clientFilter={clientFilter} onClientChange={setClientFilter}
            clients={uniqueClients}
            timeFilter={timeFilter}     onTimeChange={setTimeFilter}
          />
          <ProjectsTable projects={filtered} />
        </main>
      </div>
    </div>
  );
}
