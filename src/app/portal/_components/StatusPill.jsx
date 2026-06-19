import { pillStyle, toPipelineStatus } from './statusConfig';

/** Color-coded status pill that normalizes DB status values to pipeline labels. */
export default function StatusPill({ status, className = '' }) {
  return (
    <span
      className={`shrink-0 text-xs font-medium border px-3 py-1 rounded-full whitespace-nowrap ${pillStyle(status)} ${className}`}
    >
      {toPipelineStatus(status)}
    </span>
  );
}
