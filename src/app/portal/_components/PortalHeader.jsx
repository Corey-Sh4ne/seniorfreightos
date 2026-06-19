export default function PortalHeader({ projectCount }) {
  return (
    <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.12em] leading-none">
              SeniorFreightOS
            </p>
            <h1 className="text-base font-semibold text-zinc-900 leading-tight mt-0.5">
              Client Portal
            </h1>
          </div>
        </div>

        {/* Project count badge */}
        {projectCount > 0 && (
          <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full">
            {projectCount} {projectCount === 1 ? 'project' : 'projects'}
          </span>
        )}
      </div>
    </header>
  );
}
