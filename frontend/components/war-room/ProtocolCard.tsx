'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ProtocolCard
// Enterprise protocol distribution display
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';
import type { ProtocolStats } from '@/lib/types';
import { Network, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ProtocolCardProps {
  data: ProtocolStats[];
  loading?: boolean;
}

const PROTOCOL_ICONS: Record<string, string> = {
  TCP: '🔗',
  UDP: '📡',
  ICMP: '📶',
};

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: 'var(--cyan)',
  UDP: 'var(--info)',
  ICMP: 'var(--warning)',
};

export function ProtocolCard({ data, loading }: ProtocolCardProps) {
  if (loading) {
    return (
      <GlassPanel icon="📡" title="PROTOCOL DISTRIBUTION" badge="Loading...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Loading protocols...
          </span>
        </div>
      </GlassPanel>
    );
  }

  const total = data.reduce((sum, p) => sum + p.count, 0);

  return (
    <GlassPanel icon="📡" title="PROTOCOL DISTRIBUTION" badge={`${data.length} protocols`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((proto) => {
          const color = PROTOCOL_COLORS[proto.protocol] || 'var(--text-muted)';
          const icon = PROTOCOL_ICONS[proto.protocol] || '📦';
          const pct = total > 0 ? ((proto.count / total) * 100).toFixed(1) : '0.0';
          
          return (
            <div
              key={proto.protocol}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Protocol icon */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24, 
                height: 24,
                borderRadius: 'var(--radius-sm)',
                background: `${color}15`,
                fontSize: '0.8rem',
                flexShrink: 0,
              }}>
                {icon}
              </div>

              {/* Protocol name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontFamily: 'var(--font-data)', 
                  fontSize: '0.6rem', 
                  fontWeight: 600,
                  color: color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {proto.protocol}
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-data)', 
                  fontSize: '0.55rem', 
                  color: 'var(--text-muted)',
                }}>
                  {proto.count.toLocaleString()} flows
                </div>
              </div>

              {/* Percentage bar */}
              <div style={{ 
                width: 60, 
                height: 4, 
                background: 'var(--bg-elevated)',
                borderRadius: 999,
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 999,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              {/* Percentage text */}
              <span style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                width: '2.5rem',
                textAlign: 'right',
              }}>
                {pct}%
              </span>
            </div>
          );
        })}

        {/* Summary footer */}
        <div style={{
          marginTop: 4,
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--cyan-muted)',
          border: '1px solid var(--cyan-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <ArrowUpRight size={12} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'var(--cyan)' }}>
            {total.toLocaleString()} total flows
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
