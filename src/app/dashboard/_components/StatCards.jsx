import { LayoutDashboard, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const CARDS = [
  { key: 'active',   label: 'Active Projects', Icon: LayoutDashboard, iconBg: '#EFF6FF', iconColor: '#2563EB' },
  { key: 'delayed',  label: 'Delayed',          Icon: AlertTriangle,   iconBg: '#FEF2F2', iconColor: '#EF4444', danger: true },
  { key: 'quotes',   label: 'Pending Quotes',   Icon: FileText,        iconBg: '#FFFBEB', iconColor: '#D97706' },
  { key: 'doneWeek', label: 'Done This Week',   Icon: CheckCircle,     iconBg: '#F0FDF4', iconColor: '#16A34A' },
];

export default function StatCards({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {CARDS.map(({ key, label, Icon, iconBg, iconColor, danger }) => {
        const value = stats[key] ?? 0;
        const numColor = danger && value > 0 ? '#DC2626' : '#111827';
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '24px' }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', background: iconBg }}>
              <Icon size={20} color={iconColor} />
            </div>
            <div>
              <p style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1, color: numColor }}>{value}</p>
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>{label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
