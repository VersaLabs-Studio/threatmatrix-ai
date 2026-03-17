// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — LoadingState
// Skeleton loaders for all async content areas
// ═══════════════════════════════════════════════════════

interface LoadingStateProps {
  rows?: number;
  height?: number | string;
  className?: string;
}

/** Full-panel skeleton bar sequence */
export function LoadingState({ rows = 4, height = 20 }: LoadingStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height,
            width: i === rows - 1 ? '70%' : '100%',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      ))}
    </div>
  );
}

/** Metric card skeleton */
export function MetricSkeleton() {
  return (
    <div className="glass-panel-static" style={{ padding: '1rem 1.25rem' }}>
      <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 28, width: '40%' }} />
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0.75rem 1rem' }}>
          <div
            className="skeleton"
            style={{ height: 14, width: i === 0 ? '80%' : `${60 + (i % 5) * 8}%` }}
          />
        </td>
      ))}
    </tr>
  );
}
