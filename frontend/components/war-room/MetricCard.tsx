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
  cyan:     { color: 'var(--cyan)',     textShadow: '0 0 8px rgba(0,240,255,0.15)' },
  warning:  { color: 'var(--warning)',  textShadow: '0 0 8px rgba(245,158,11,0.15)' },
  critical: { color: 'var(--critical)', textShadow: '0 0 8px rgba(239,68,68,0.2)' },
  safe:     { color: 'var(--safe)',     textShadow: '0 0 8px rgba(34,197,94,0.15)' },
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
    <div
      className="glass-panel-static"
      style={{
        padding: '1rem 1.25rem',
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accentStyle.color,
          opacity: 0.6,
        }}
      />
      
      <div>
        <div
          className="metric-label"
          style={{
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-data)',
            fontSize: '0.65rem',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <span
            className="metric-value"
            style={{
              ...accentStyle,
              fontSize: '1.75rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              lineHeight: 1,
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {displayVal}
          </span>
          {unit && (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {unit}
            </span>
          )}
        </div>
      </div>
      
      {delta !== undefined && delta !== 0 && (
        <div style={{ marginTop: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              color: delta > 0 ? 'var(--critical)' : 'var(--safe)',
              background: delta > 0 ? 'var(--critical-dim)' : 'var(--safe-dim)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
            }}
          >
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        </div>
      )}
    </div>
  );
}
