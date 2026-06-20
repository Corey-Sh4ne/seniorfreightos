'use client';

import { useTransition } from 'react';
import StatusRail from '@/components/StatusRail';
import StatusPill from '@/app/portal/_components/StatusPill';
import { toPipelineStatus, borderAccent } from '@/app/portal/_components/statusConfig';
import { resetProject } from '../_actions/opsActions';
import { StageFlow } from './OpsProjectCardParts';

const COMPLETED_STATUSES = new Set(['complete', 'invoiced']);

export default function OpsProjectCard({ project, completed = false }) {
  const [pending, startTransition] = useTransition();
  const run = (fn) => startTransition(() => { fn(); });

  const isComplete = completed || COMPLETED_STATUSES.has(project.status);

  const receivedCount = project.shipments.filter((s) => s.received).length;
  const completedCount = project.installTasks.filter((t) => t.completed).length;
  const allReceived =
    project.shipments.length > 0 && receivedCount === project.shipments.length;
  const allComplete =
    project.installTasks.length > 0 && completedCount === project.installTasks.length;

  return (
    <div className={`rounded-lg border border-l-4 border-zinc-200 bg-white ${borderAccent(project.status)}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-900">{project.code}</span>
            {isComplete ? (
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Complete ✓
              </span>
            ) : (
              <StatusPill status={project.status} />
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-700">{project.clientName}</p>
          <p className="text-xs text-zinc-400">{project.facilityName}</p>
        </div>
      </div>

      {/* Pipeline rail */}
      <div className="px-5 py-4">
        <StatusRail currentStatus={toPipelineStatus(project.status)} />
      </div>

      {/* Stage-based body: locked summaries + the single active stage */}
      <StageFlow
        project={project}
        pending={pending}
        run={run}
        allReceived={allReceived}
        allComplete={allComplete}
      />

      {/* Full reset is only offered once the project is finished */}
      {isComplete && (
        <div className="flex justify-end border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm('Reset this project to the very start? This clears all shipment and install progress.')) {
                run(() => resetProject(project.id));
              }
            }}
            className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Reset Project
          </button>
        </div>
      )}
    </div>
  );
}
