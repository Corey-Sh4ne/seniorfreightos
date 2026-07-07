'use client';

import { useTransition } from 'react';
import StatusRail from '@/components/StatusRail';
import StatusBadge from '@/components/StatusBadge';
import { toPipelineStatus } from '@/app/portal/_components/statusConfig';
import { resetProject, resetToInstalling } from '../_actions/opsActions';
import { StageFlow } from './OpsProjectCardParts';

const COMPLETED_STATUSES = new Set(['complete', 'invoiced']);

function getBorderColor(status) {
  switch (status) {
    case 'awarded': return '#8B5CF6';
    case 'receiving': return '#F59E0B';
    case 'staging': return '#EA580C';
    case 'scheduled': return '#06B6D4';
    case 'delivered': return '#14B8A6';
    case 'installing': return '#6366F1';
    case 'complete': return '#10B981';
    default: return '#2563EB';
  }
}

function getHeaderTint(status) {
  switch (status) {
    case 'awarded': return '#FAF5FF';
    case 'receiving': return '#FFFBEB';
    case 'installing': return '#EEF2FF';
    default: return '#F8FAFC';
  }
}

const COMPACT_RESET_BTN = {
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid #D4D4D8',
  background: 'white',
  color: '#52525B',
  cursor: 'pointer',
};

const COMPACT_RESET_PROJECT_BTN = {
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#6B7280',
  background: 'white',
  cursor: 'pointer',
};

export default function OpsProjectCard({ project, completed = false }) {
  const [pending, startTransition] = useTransition();
  const run = (fn) => startTransition(() => { fn(); });

  const isComplete = completed || COMPLETED_STATUSES.has(project.status);

  if (isComplete) {
    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderLeft: '4px solid #10B981',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '12px',
          opacity: 0.8,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono"
                style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}
              >
                {project.code}
              </span>
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Complete ✓
              </span>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginTop: '6px' }}>
              {project.clientName}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
              {project.facilityName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Reset to Installing? This reopens the install task checklist.')) {
                  run(() => resetToInstalling(project.id));
                }
              }}
              style={COMPACT_RESET_BTN}
            >
              Reset to Installing
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Reset this project to prospect? This will clear all progress, the accepted quote, and invoice data so the full demo can be run again.')) {
                  run(() => resetProject(project.id));
                }
              }}
              style={COMPACT_RESET_PROJECT_BTN}
            >
              Reset Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  const receivedCount = project.shipments.filter((s) => s.received).length;
  const completedCount = project.installTasks.filter((t) => t.completed).length;
  const allReceived =
    project.shipments.length > 0 && receivedCount === project.shipments.length;
  const allComplete =
    project.installTasks.length > 0 && completedCount === project.installTasks.length;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        marginBottom: '16px',
        overflow: 'hidden',
        borderLeft: `4px solid ${getBorderColor(project.status)}`,
      }}
    >
      {/* Header */}
      <div style={{ background: getHeaderTint(project.status), padding: '16px 20px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#6B7280',
              letterSpacing: '0.08em',
              fontFamily: 'monospace',
            }}
          >
            {project.code}
          </span>
          <StatusBadge status={project.status} />
        </div>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '4px 0 2px' }}>
          {project.clientName}
        </p>
        <p style={{ fontSize: '13px', color: '#6B7280' }}>{project.facilityName}</p>
      </div>

      {/* Pipeline rail */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 24px',
            overflowX: 'auto',
          }}>
            <StatusRail currentStatus={toPipelineStatus(project.status)} />
          </div>
        </div>
      </div>

      {/* Action section divider */}
      <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '8px', paddingTop: '16px' }}>
        <StageFlow
          project={project}
          pending={pending}
          run={run}
          allReceived={allReceived}
          allComplete={allComplete}
        />
      </div>
    </div>
  );
}
