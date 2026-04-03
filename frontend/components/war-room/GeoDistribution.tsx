'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — GeoDistribution
// Country breakdown of traffic origin
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';

interface GeoEntry {
  country: string;
  flag: string;
  percent: number;
  isAnomaly?: boolean;
}

// No mock data — GeoIP requires GeoIP database on VPS (not available)
// Shows placeholder until GeoIP integration is added
interface GeoDistributionProps {
  data?: GeoEntry[];
}

export function GeoDistribution({ data = [] }: GeoDistributionProps) {
  const entries = data.length > 0 ? data : [];

  return (
    <GlassPanel tilt refract icon="🌍" title="GEO DISTRIBUTION" style={{ height: '100%' }}>
      {entries.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 120, fontFamily: 'var(--font-data)', fontSize: '0.7rem',
          color: 'var(--text-muted)', textAlign: 'center',
        }}>
          GeoIP requires MaxMind DB<br />Not available in current deployment
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry) => (
          <div key={entry.country} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{entry.flag}</span>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.72rem',
                color: entry.isAnomaly ? 'var(--critical)' : 'var(--text-muted)',
                flex: 1,
              }}
            >
              {entry.country}
            </span>
            <div
              style={{
                width: 80,
                height: 4,
                background: 'var(--bg-elevated)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${entry.percent}%`,
                  height: '100%',
                  background: entry.isAnomaly
                    ? 'linear-gradient(90deg, var(--critical), var(--high))'
                    : 'linear-gradient(90deg, var(--cyan), var(--info))',
                  borderRadius: 999,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.7rem',
                color: entry.isAnomaly ? 'var(--critical)' : 'var(--text-primary)',
                width: '2.5rem',
                textAlign: 'right',
              }}
            >
              {entry.percent}%
            </span>
          </div>
        ))}
        </div>
      )}
    </GlassPanel>
  );
}
