import { DB_TO_PIPELINE } from '@/app/portal/_components/statusConfig';

const STATUS_STYLES = {
  prospect:   'bg-gray-100  text-gray-600   border-gray-200',
  quoted:     'bg-blue-50   text-blue-700   border-blue-200',
  denied:     'bg-red-50    text-red-600    border-red-200',
  awarded:    'bg-purple-50 text-purple-700 border-purple-200',
  receiving:  'bg-amber-50  text-amber-700  border-amber-200',
  staging:    'bg-orange-50 text-orange-700 border-orange-200',
  scheduled:  'bg-cyan-50   text-cyan-700   border-cyan-200',
  delivered:  'bg-teal-50   text-teal-700   border-teal-200',
  installing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  complete:   'bg-green-50  text-green-700  border-green-200',
  invoiced:   'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const FALLBACK_STYLE = 'bg-gray-100 text-gray-600 border-gray-200';

export default function StatusBadge({ status, className = '' }) {
  const key = typeof status === 'string' ? status.toLowerCase() : '';
  const styles = STATUS_STYLES[key] ?? FALLBACK_STYLE;
  const label = DB_TO_PIPELINE[key] ?? (typeof status === 'string' && status.length > 0
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : '—');

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
