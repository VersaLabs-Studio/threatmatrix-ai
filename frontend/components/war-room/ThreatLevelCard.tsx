'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ThreatLevelCard
// Enterprise threat level display with details
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface ThreatLevelCardProps {
  level: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'SAFE';
  alertStats: { critical: number; high: number; medium: number; low: number; info: number };
  loading?: boolean;
}

const THREAT_CONFIG = {
  CRITICAL: {
    icon: <ShieldAlert size={20} />,
    color: 'var(--critical)',
    bg: 'var(--critical-dim)',
    label: 'CRITICAL',
    description: 'Active attack detected',
  },
  HIGH: {
    icon: <AlertTriangle size={20} />,
    color: 'var(--high)',
    bg: 'var(--high-dim)',
    label: 'HIGH',
    description: 'Likely attack activity',
  },
  ELEVATED: {
    icon: <ShieldCheck size={20} />,
    color: 'var(--warning)',
    bg: 'var(--warning-dim)',
    label: 'ELEVATED',
    description: 'Suspicious activity',
  },
  SAFE: {
    icon: <Shield size={20} />,
    color: 'var(--safe)',
    bg: 'var(--safe-dim)',
    label: 'SAFE',
    description: 'Normal operations',
  },
};

export function ThreatLevelCard({ level, alertStats, loading }: ThreatLevelCardProps) {
  if (loading) {
    return (
      <GlassPanel icon="🛡️" title="THREAT LEVEL" badge="Loading...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Loading threat level...
          </span>
        </div>
      </GlassPanel>
    );
  }

  const config = THREAT_CONFIG[level];
  const totalAlerts = alertStats.critical + alertStats.high + alertStats.medium + alertStats.low;

  return (
    <GlassPanel icon="🛡️" title="THREAT LEVEL" badge={config.label}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Main threat indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: config.bg,
          border: `1px solid ${config.color}44`,
        }}>
          <div style={{ color: config.color }}>
            {config.icon}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              fontWeight: 700,
              color: config.color,
              letterSpacing: '0.05em',
            }}>
              {config.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
            }}>
              {config.description}
            </div>
          </div>
        </div>

        {/* Alert breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'Critical', count: alertStats.critical, color: 'var(--critical)' },
            { label: 'High', count: alertStats.high, color: 'var(--high)' },
            { label: 'Medium', count: alertStats.medium, color: 'var(--warning)' },
            { label: 'Low', count: alertStats.low, color: 'var(--info)' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: item.color }}>
                {item.label}
              </span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.count}
              </span>
            </div>
          ))}
        </div>

        {/* Summary footer */}
        <div style={{
          marginTop: 4,
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm)',
          background: config.bg,
          border: `1px solid ${config.color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <Info size={12} style={{ color: config.color }} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: config.color }}>
            {totalAlerts} total alerts (24h)
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
