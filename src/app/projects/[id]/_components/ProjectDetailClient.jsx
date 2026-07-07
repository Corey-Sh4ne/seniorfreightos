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
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: '100px',
        padding: '0 20px',
        borderRight: isLast ? 'none' : '1px solid #F3F4F6',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 700, color: danger ? '#DC2626' : '#111827' }}>{value}</p>
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
          style={{
            background: 'white',
            borderBottom: '1px solid #E5E7EB',
            padding: '0 24px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700"
              style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              ← All Projects
            </Link>
            <h1 style={{ display: 'flex', alignItems: 'center', fontSize: '14px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ background: '#1D4ED8', color: 'white', borderRadius: '6px', padding: '2px 8px', fontSize: '13px', fontWeight: 700, marginRight: '10px' }}>{project.code}</span>
              <span style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.clientName}</span>
              <span style={{ color: '#9CA3AF', margin: '0 8px' }}>·</span>
              <span style={{ color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.facilityName}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${pillStyle(project.status)}`}
              style={{ flexShrink: 0 }}
            >
              <span className="text-[8px] leading-none">●</span>
              {statusLabel}
            </span>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                  style={{ flexShrink: 0 }}
                >
                  Edit Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                  style={{ flexShrink: 0 }}
                >
                  Delete Project
                </button>
              </>
            )}
          </div>
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
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            marginBottom: '16px',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'visible',
          }}>
            <div style={{
              padding: '24px 32px',
              overflowX: 'auto',
            }}>
              <StatusRail currentStatus={toPipelineStatus(project.status)} />
            </div>
          </div>

          {/* ── Stat cards row ───────────────────────────────────────────── */}
          <div
            style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px 4px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
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
            <div
              style={{
                background: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                padding: '0 24px',
                display: 'flex',
              }}
            >
              {visibleTabs.map((tab) => {
                const Icon = TAB_ICONS[tab];
                const locked = ADMIN_ONLY_TABS.has(tab);
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="transition-colors"
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      borderBottom: isActive ? '2px solid #1D4ED8' : '2px solid transparent',
                      color: isActive ? '#1D4ED8' : '#6B7280',
                      background: 'transparent',
                      marginBottom: '-1px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {locked && <Lock size={14} />}
                      {Icon && <Icon size={14} />}
                      {tab}
                    </span>
                  </button>
                );
              })}
              {!isAdmin && (
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#D97706',
                    fontWeight: 500,
                    paddingRight: '4px',
                  }}
                >
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
