// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — StatusBadge
// Severity and status badges using design system classes
// ═══════════════════════════════════════════════════════

import { cx, getSeverityClass } from '@/lib/utils';
import type { Severity } from '@/lib/constants';

interface StatusBadgeProps {
  severity: Severity;
  label?: string;
  className?: string;
}

const LABELS: Record<Severity, string> = {
  critical: 'CRITICAL',
  high:     'HIGH',
  medium:   'MEDIUM',
  low:      'LOW',
  info:     'INFO',
};

export function StatusBadge({ severity, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cx(getSeverityClass(severity), className)}
      style={{ backdropFilter: 'invert(0.05) brightness(1.1)' }}
    >
      {label ?? LABELS[severity]}
    </span>
  );
}

// ── Status dot variant ─────────────────────────────────

interface StatusDotProps {
  status: 'live' | 'warning' | 'critical' | 'idle';
  size?: number;
}

const DOT_CLASSES: Record<StatusDotProps['status'], string> = {
  live:     'status-dot status-dot--live',
  warning:  'status-dot status-dot--warning',
  critical: 'status-dot status-dot--critical',
  idle:     'status-dot status-dot--idle',
};

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  return (
    <span
      className={DOT_CLASSES[status]}
      style={size !== 8 ? { width: size, height: size } : undefined}
    />
  );
}
