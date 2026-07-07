export default function PortalHeader({ projectCount }) {
  return (
    <header
      style={{
        background: '#1F3864',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      className="sticky top-0 z-10"
    >
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ color: 'white' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              SeniorFreightOS
            </p>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.2,
                marginTop: '4px',
              }}
            >
              Client Portal
            </h1>
          </div>
        </div>

        {/* Project count badge */}
        {projectCount > 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '4px 12px',
              borderRadius: '9999px',
            }}
          >
            {projectCount} {projectCount === 1 ? 'project' : 'projects'}
          </span>
        )}
      </div>
    </header>
  );
}
