'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';

const COLUMNS = ['CODE', 'CLIENT', 'FACILITY', 'STATUS', 'WEIGHT', 'SHIPS', 'MILES', 'RUSH', 'CREATED'];
const PAGE_SIZE = 10;

export default function ProjectsTable({ projects }) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [projects]);

  const totalPages  = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const start       = (page - 1) * PAGE_SIZE;
  const rows        = projects.slice(start, start + PAGE_SIZE);
  const totalWeight = projects.reduce((s, p) => s + p.weight, 0);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80">
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-zinc-400">
                  No projects match your filters.
                </td>
              </tr>
            )}
            {rows.map((p) => {
              const delayed = p.status === 'Delayed';
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className={[
                    'border-b border-gray-100 last:border-0 cursor-pointer transition-colors duration-100 hover:bg-gray-50 group',
                    delayed ? 'border-l-[3px] border-l-amber-400' : 'border-l-[3px] border-l-transparent',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">{p.code}</td>
                  <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{p.client}</td>
                  <td className="px-4 py-3 text-zinc-900 font-medium whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      {delayed && <span className="text-amber-400 text-xs leading-none">⚠</span>}
                      {p.facility}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap tabular-nums">
                    {p.weight > 0 ? `${p.weight.toLocaleString()} lbs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap tabular-nums">
                    {p.shipsTotal > 0 ? `${p.shipsReceived}/${p.shipsTotal}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap tabular-nums">
                    {p.miles > 0 ? p.miles.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.rush
                      ? <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-500">Rush</span>
                      : <span className="text-zinc-200">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-[11px]">{p.created}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
        <span>
          {projects.length === 0
            ? 'No projects'
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, projects.length)} of ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          {totalWeight > 0 && (
            <span className="ml-3 text-zinc-300">·</span>
          )}
          {totalWeight > 0 && (
            <span className="ml-3">{totalWeight.toLocaleString()} lbs total</span>
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-zinc-200 text-zinc-500 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              ←
            </button>
            <span className="px-2 text-zinc-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded border border-zinc-200 text-zinc-500 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
