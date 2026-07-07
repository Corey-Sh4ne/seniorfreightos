'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FileText, Clock, DollarSign, Lock } from 'lucide-react';
import Sidebar from '@/app/dashboard/_components/Sidebar';
import StatusRail from '@/components/StatusRail';
import { toPipelineStatus, pillStyle } from '@/app/portal/_components/statusConfig';
import { deleteProject } from '../_actions/projectActions';
import ConfirmModal from '@/components/ConfirmModal';
import EmailToast from '@/components/EmailToast';
import EditProjectModal from './EditProjectModal';
import ShipmentsTab from './ShipmentsTab';
import InstallTasksTab from './InstallTasksTab';
import PricingQuoteTab from './PricingQuoteTab';
import ActivityLogTab from './ActivityLogTab';
import NotesTab from './NotesTab';
import InvoiceSection from './InvoiceSection';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', timeZone: 'UTC',
});

function StatCard({ label, value, danger, isLast }) {
  return (
    <div
      style={{
        paddingRight: isLast ? '0' : '24px',
        borderRight: isLast ? 'none' : '1px solid #F3F4F6',
        minWidth: '120px',
      }}
    >
      <p style={{fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'}}>{label}</p>
      <p style={{fontSize: '20px', fontWeight: 700, marginTop: '4px', color: danger ? '#DC2626' : '#111827'}}>{value}</p>
    </div>
  );
}

const ALL_TABS = ['Shipments', 'Install Tasks', 'Pricing Quote', 'Notes', 'History'];
const ADMIN_ONLY_TABS = new Set(['Pricing Quote', 'History']);
const TAB_ICONS = {
  'Pricing Quote': DollarSign,
  Notes: FileText,
  History: Clock,
};

export default function ProjectDetailClient({
  project, shipments, installTasks, role,
  rateCards = [], suggestedRateCardId = null, defaultRateCardId = null,
  activityLog = [],
}) {
  const [activeTab, setActiveTab] = useState('Shipments');
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [emailToast, setEmailToast] = useState(null);
  const isAdmin = role === 'admin';

  function handleEmailSent(emailNotification) {
    if (!emailNotification?.to) return;
    setEmailToast(`Email notification sent to ${emailNotification.to}`);
  }

  const totalWeight   = shipments.reduce((s, sh) => s + sh.qty * sh.weightPerUnitLbs, 0);
  const visibleTabs   = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => !ADMIN_ONLY_TABS.has(t));
  const startDateStr  = project.createdAt ? DATE_FMT.format(new Date(project.createdAt)) : '—';
  const statusLabel   = project.status
    ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
    : '—';

  const statCards = [
    { label: 'Total Weight',   value: `${totalWeight.toLocaleString()} lb` },
    { label: 'Miles from Hub', value: `${project.milesFromHub} mi` },
    { label: 'Storage',        value: `${project.storageDays} days` },
    { label: 'Rush Delivery',  value: project.rushDelivery ? 'Yes' : 'No', danger: project.rushDelivery },
    { label: 'Start',          value: startDateStr },
  ];

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      // deleteProject redirects to /projects on success — the Promise will
      // never resolve to an object in that case. A returned value here means
      // the server action rejected (e.g. unauthorized).
      const res = await deleteProject(project.id);
      if (res?.error) setDeleteError(res.error);
    });
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden" style={{background: '#F3F4F6'}}>
        {/* ── Top header bar ─────────────────────────────────────────────── */}
        <header
          className="bg-white border-b border-gray-200 h-14 flex items-center gap-3 shrink-0"
          style={{paddingLeft: '24px', paddingRight: '24px'}}
        >
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            ← All Projects
          </Link>
          <h1 className="text-sm truncate flex-1">
            <span className="text-gray-400">&nbsp;·&nbsp;</span>
            <span className="font-semibold text-gray-900">{project.code}</span>
            <span className="text-gray-400">&nbsp;·&nbsp;</span>
            <span className="text-gray-500">{project.clientName}</span>
          </h1>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${pillStyle(project.status)}`}
          >
            <span className="text-[8px] leading-none">●</span>
            {statusLabel}
          </span>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Edit Project
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Delete Project
              </button>
            </>
          )}
        </header>

        {/* ── Scrollable content area ────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '24px',
            paddingBottom: '24px',
          }}
        >
          {/* ── Status rail card ─────────────────────────────────────────── */}
          <div
            style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              padding: '24px 48px',
              marginBottom: '16px',
              width: '100%',
              overflowX: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <StatusRail currentStatus={toPipelineStatus(project.status)} />
          </div>

          {/* ── Stat cards row ───────────────────────────────────────────── */}
          <div
            style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px 24px',
              marginBottom: '16px',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {statCards.map((sc, i) => (
              <StatCard
                key={sc.label}
                label={sc.label}
                value={sc.value}
                danger={sc.danger}
                isLast={i === statCards.length - 1}
              />
            ))}
          </div>

          {/* ── Invoice section (only when the project is billable) ──────── */}
          {isAdmin && (project.status === 'complete' || project.status === 'invoiced') && (
            <InvoiceSection project={project} onEmailSent={handleEmailSent} />
          )}

          {/* ── Tabs + content card ──────────────────────────────────────── */}
          <div
            style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Tab bar */}
            <div className="border-b border-gray-200 px-4 flex">
              {visibleTabs.map((tab) => {
                const Icon = TAB_ICONS[tab];
                const locked = ADMIN_ONLY_TABS.has(tab);
                return (
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
                    <span className="flex items-center gap-1.5">
                      {locked && <Lock size={14} />}
                      {Icon && <Icon size={14} />}
                      {tab}
                    </span>
                  </button>
                );
              })}
              {!isAdmin && (
                <span className="ml-auto flex items-center text-xs text-amber-600 font-medium pr-1">
                  Admin-only tab hidden
                </span>
              )}
            </div>

            {/* Tab content */}
            <div style={{padding: '24px'}}>
              {activeTab === 'Shipments' && (
                <ShipmentsTab
                  shipments={shipments}
                  projectId={project.id}
                  projectStatus={project.status}
                />
              )}
              {activeTab === 'Install Tasks' && (
                <InstallTasksTab
                  installTasks={installTasks}
                  projectId={project.id}
                  projectStatus={project.status}
                />
              )}
              {activeTab === 'Pricing Quote' && isAdmin && (
                <PricingQuoteTab
                  project={project}
                  shipments={shipments}
                  installTasks={installTasks}
                  rateCards={rateCards}
                  suggestedRateCardId={suggestedRateCardId}
                  defaultRateCardId={defaultRateCardId}
                  onEmailSent={handleEmailSent}
                />
              )}
              {activeTab === 'Notes' && (
                <NotesTab notes={project.notes} stageNotes={project.stageNotes} />
              )}
              {activeTab === 'History' && isAdmin && (
                <ActivityLogTab entries={activityLog} />
              )}
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Project?"
          message={`Are you sure you want to delete ${project.code} — ${project.facilityName}? This will permanently remove the project and all associated shipments and install tasks. This cannot be undone.`}
          confirmLabel="Delete Project"
          pending={deletePending}
          error={deleteError}
          onConfirm={handleDelete}
          onClose={() => {
            if (deletePending) return;
            setShowDeleteConfirm(false);
            setDeleteError(null);
          }}
        />
      )}

      {emailToast && (
        <EmailToast message={emailToast} onDismiss={() => setEmailToast(null)} />
      )}
    </div>
  );
}
