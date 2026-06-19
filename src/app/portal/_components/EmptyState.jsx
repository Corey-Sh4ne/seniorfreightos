export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
        <svg
          className="w-8 h-8 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-zinc-700 mb-2">No projects yet</h2>
      <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
        No FF&amp;E projects are linked to your account. Contact your Olson Resource Group
        representative to get access.
      </p>
    </div>
  );
}
