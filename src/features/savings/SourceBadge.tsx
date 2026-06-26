import { useSavings } from './SavingsContext';

// Small live/sample indicator shown in each savings panel's note slot.
export function SourceBadge() {
  const { source, loading } = useSavings();
  const live = source === 'live';
  return (
    <span className={`src-badge ${live ? 'src-badge--live' : ''}`}>
      <i className="src-dot" />
      {loading ? 'connecting…' : live ? 'live · your telemetry' : 'sample data'}
    </span>
  );
}
