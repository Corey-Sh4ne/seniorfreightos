'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/dashboard/_components/Sidebar';
import StatusRail from '@/components/StatusRail';
import { VALID_TRANSITIONS } from '@/utils/statusPipeline';
import { toPipelineStatus, pillStyle } from '@/app/portal/_components/statusConfig';
import { advanceStatus } from '../_actions/projectActions';
import ShipmentsTab from './ShipmentsTab';
import InstallTasksTab from './InstallTasksTab';
import PricingQuoteTab from './PricingQuoteTab';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', timeZone: 'UTC',
});

function StatCard({ label, value, danger }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 min-w-[110px]">
      <p className={`text-lg font-bold leading-tight ${danger ? 'text-red-500' : 'text-zinc-900'}`}>
        {value}
      </p>
      <p className="text-xs text-zinc-400 mt-0.5 whitespace-nowrap">{label}</p>
    </div>
  );
}

const ALL_TABS = ['Shipments', 'Install Tasks', 'Pricing Quote', 'Notes'];

export default function ProjectDetailClient({
  project, shipments, installTasks, pricing, isAdmin,
}) {
  const [activeTab, setActiveTab] = useState('Shipments');
  const [pending, startTransition] = useTransition();

  // VALID_TRANSITIONS is keyed by pipeline labels, not raw DB values, so we must
  // normalize project.status before the lookup or the button stays disabled.
  const nextOptions   = VALID_TRANSITIONS[toPipelineStatus(project.status)] ?? [];
  const canAdvance    = nextOptions.length > 0;
  const totalWeight   = shipments.reduce((s, sh) => s + sh.qty * sh.weightPerUnitLbs, 0);
  const visibleTabs   = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => t !== 'Pricing Quote');
  const startDateStr  = project.createdAt ? DATE_FMT.format(new Date(project.createdAt)) : '—';
  const statusLabel   = project.status
    ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
    : '—';

  function handleAdvance() {
    startTransition(() => advanceStatus(project.id));
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top header bar ─────────────────────────────────────────────── */}
        <header className="bg-white border-b border-zinc-200 h-14 flex items-center px-4 gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="text-blue-600 text-xs font-semibold whitespace-nowrap hover:underline shrink-0"
          >
            ← All Projects
          </Link>
          <h1 className="text-sm font-bold text-zinc-900 truncate flex-1">
            {project.code}&nbsp;&nbsp;·&nbsp;&nbsp;{project.clientName}&nbsp;&nbsp;·&nbsp;&nbsp;{project.facilityAddress}
          </h1>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${pillStyle(project.status)}`}
          >
            <span className="text-[8px] leading-none">●</span>
            {statusLabel}
          </span>
        </header>

        {/* ── Status rail card ───────────────────────────────────────────── */}
        <div className="bg-white px-5 pt-4 pb-6 shrink-0">
          {/* Scaled down so the 9-stage rail fits cleanly on one line. */}
          <div className="origin-left scale-90">
            <StatusRail currentStatus={toPipelineStatus(project.status)} />
          </div>
        </div>

        {/* ── Key stats + Advance Status ─────────────────────────────────── */}
        <div className="bg-white border-b border-zinc-200 px-4 pt-1 pb-4 shrink-0">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 shadow-sm bg-zinc-50/60 px-3 py-3">
            <StatCard label="Total Weight"   value={`${totalWeight.toLocaleString()} lb`} />
            <StatCard label="Miles from Hub" value={`${project.milesFromHub} mi`} />
            <StatCard label="Storage"        value={`${project.storageDays} days`} />
            <StatCard
              label="Rush Delivery"
              value={project.rushDelivery ? 'Yes' : 'No'}
              danger={project.rushDelivery}
            />
            <StatCard label="Start" value={startDateStr} />

            <div className="ml-auto shrink-0">
              <button
                onClick={handleAdvance}
                disabled={!canAdvance || pending}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 active:bg-zinc-800
                           disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm
                           font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                ▶&nbsp;{pending ? 'Advancing…' : 'Advance Status'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-zinc-200 px-4 flex shrink-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900',
              ].join(' ')}
            >
              {tab === 'Pricing Quote' ? '🔒 Pricing Quote' : tab}
            </button>
          ))}
          {!isAdmin && (
            <span className="ml-auto flex items-center text-xs text-amber-600 font-medium pr-1">
              Admin-only tab hidden
            </span>
          )}
        </div>

        {/* ── Tab content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === 'Shipments' && (
            <ShipmentsTab shipments={shipments} projectId={project.id} />
          )}
          {activeTab === 'Install Tasks' && (
            <InstallTasksTab installTasks={installTasks} projectId={project.id} />
          )}
          {activeTab === 'Pricing Quote' && isAdmin && (
            <PricingQuoteTab pricing={pricing} project={project} />
          )}
          {activeTab === 'Notes' && (
            <div className="bg-white rounded-lg border border-zinc-200 p-5 max-w-2xl">
              <h3 className="text-sm font-semibold text-zinc-700 mb-3">Notes — Admin only</h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                {project.notes || 'No notes recorded.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
