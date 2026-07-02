const SELECT_CLS =
  'px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-700 ' +
  'outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer';

export default function FilterBar({
  search, onSearch,
  statusFilter, onStatusChange, statuses,
  clientFilter, onClientChange, clients,
  timeFilter = 'all', onTimeChange,
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search code, client, facility…"
        className={
          'flex-1 min-w-[200px] px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white ' +
          'outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-400'
        }
      />

      {/* Status */}
      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={SELECT_CLS}>
        <option value="All">All Statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Client */}
      <select value={clientFilter} onChange={(e) => onClientChange(e.target.value)} className={SELECT_CLS}>
        <option value="All">All Clients</option>
        {clients.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Date range */}
      <select
        value={timeFilter}
        onChange={(e) => onTimeChange?.(e.target.value)}
        className={SELECT_CLS}
      >
        <option value="all">All Time</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="30d">Last 30 Days</option>
      </select>

      {/* Clear button — only visible when filters are active */}
      {(search || statusFilter !== 'All' || clientFilter !== 'All' || timeFilter !== 'all') && (
        <button
          onClick={() => {
            onSearch('');
            onStatusChange('All');
            onClientChange('All');
            onTimeChange?.('all');
          }}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
