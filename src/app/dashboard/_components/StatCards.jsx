import { LayoutDashboard, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const CARDS = [
  {
    key: 'active',
    label: 'Active Projects',
    Icon: LayoutDashboard,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    key: 'delayed',
    label: 'Delayed',
    Icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    danger: true,
  },
  {
    key: 'quotes',
    label: 'Pending Quotes',
    Icon: FileText,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    key: 'doneWeek',
    label: 'Done This Week',
    Icon: CheckCircle,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
];

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, Icon, iconBg, iconColor, danger }) => {
        const value = stats[key] ?? 0;
        const numberColor = danger && value > 0 ? 'text-red-600' : 'text-gray-900';
        return (
          <div
            key={key}
            className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6"
          >
            <div className={`shrink-0 flex items-center justify-center rounded-lg p-2 w-10 h-10 ${iconBg} ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-3xl font-bold leading-none ${numberColor}`}>{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
