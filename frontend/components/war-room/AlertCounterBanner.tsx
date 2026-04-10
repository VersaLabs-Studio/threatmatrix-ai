'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — AlertCounterBanner
// REST-polling severity count banner for War Room
// Shows alert distribution by severity with color coding
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SEVERITY_COLORS, type Severity } from '@/lib/constants';

interface AlertStats {
  total: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export function AlertCounterBanner() {
  const router = useRouter();
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: err } = await api.get<AlertStats>('/api/v1/alerts/stats');
      if (data && !err) {
        setStats(data);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (error || !stats) return null;

  const severityItems: { key: Severity; label: string }[] = [
    { key: 'critical', label: 'CRIT' },
    { key: 'high', label: 'HIGH' },
    { key: 'medium', label: 'MED' },
    { key: 'low', label: 'LOW' },
  ];

  return (
    <div
      onClick={() => router.push('/alerts')}
      style={{
        position: 'fixed',
        bottom: 48,
        right: 16,
        zIndex: 100,
        background: 'rgba(17, 17, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-active)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {severityItems.map(({ key, label }) => {
        const count = stats.by_severity?.[key] ?? 0;
        const color = SEVERITY_COLORS[key];
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: color,
              boxShadow: count > 0 ? `0 0 6px ${color}88` : 'none',
              animation: key === 'critical' && count > 0 ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: '0.58rem',
              color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em',
            }}>
              {label}
            </span>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: '0.72rem',
              color: count > 0 ? color : 'var(--text-muted)',
              fontWeight: 700,
            }}>
              {count}
            </span>
          </div>
        );
      })}
      <div style={{
        width: 1, height: 20, background: 'var(--border)', flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-data)', fontSize: '0.65rem',
        color: 'var(--text-secondary)', fontWeight: 700,
      }}>
        {stats.total}
      </span>
    </div>
  );
}
