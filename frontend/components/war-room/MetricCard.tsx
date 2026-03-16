'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — MetricCard
// Animated counter metric display with accent color
// Used in War Room header metrics row
// ═══════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/GlassPanel';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  accent?: 'cyan' | 'warning' | 'critical' | 'safe' | 'info';
  delta?: number;   // positive = up, negative = down
  loading?: boolean;
}

const ACCENT_STYLE: Record<NonNullable<MetricCardProps['accent']>, React.CSSProperties> = {
  cyan:     { color: 'var(--cyan)',     textShadow: '0 0 20px rgba(0,240,255,0.3)' },
  warning:  { color: 'var(--warning)',  textShadow: '0 0 15px rgba(245,158,11,0.3)' },
  critical: { color: 'var(--critical)', textShadow: '0 0 15px rgba(239,68,68,0.4)' },
  safe:     { color: 'var(--safe)',     textShadow: '0 0 15px rgba(34,197,94,0.3)' },
  info:     { color: 'var(--info)',     textShadow: 'none' },
};

/** Animates a number from `from` to `to` over `duration` ms */
function useCountUp(to: number, duration = 600): number {
  const [current, setCurrent] = useState(to);
  const fromRef = useRef(to);
  const rafRef  = useRef<number>(0);

  useEffect(() => {
    const from  = fromRef.current;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration]);

  return current;
}

export function MetricCard({ label, value, unit, accent = 'cyan', delta, loading }: MetricCardProps) {
  const isNumber   = typeof value === 'number';
  const animated   = useCountUp(isNumber ? (value as number) : 0);
  const displayVal = isNumber ? animated.toLocaleString() : value;
  const accentStyle = ACCENT_STYLE[accent];

  if (loading) {
    return (
      <div className="glass-panel-static" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: 0 }}>
        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 28, width: '45%' }} />
      </div>
    );
  }

  return (
    <GlassPanel tilt refract severity={accent === 'cyan' ? 'info' : accent} style={{ padding: '1.25rem 1.5rem', flex: 1, minWidth: 0 }}>
      <div className="metric-label" style={{ letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <span
          className="metric-value"
          style={{ ...accentStyle, fontSize: '2.25rem', fontFamily: 'var(--font-heading)', transition: 'transform 0.3s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {displayVal}
        </span>
        {unit && (
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
            {unit}
          </span>
        )}
        {delta !== undefined && delta !== 0 && (
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.75rem',
              color: delta > 0 ? 'var(--critical)' : 'var(--safe)',
              marginLeft: 6,
              background: delta > 0 ? 'var(--critical-dim)' : 'var(--safe-dim)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
            }}
          >
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </GlassPanel>
  );
}
