'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — TopTalkers
// Horizontal bar chart of top source IPs by traffic volume
// Data: GET /api/v1/flows/top-talkers (10s refresh)
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';
import { LoadingState } from '@/components/shared/LoadingState';
import { formatBytes } from '@/lib/utils';
import type { TopTalker } from '@/hooks/useFlows';

interface TopTalkersProps {
  data: TopTalker[];
  loading?: boolean;
}

// Mock data for demonstration
const MOCK_TALKERS: TopTalker[] = [
  { ip: '10.0.1.5',      bytes_total: 45_200_000, flow_count: 342, country: 'ET', is_anomalous: true  },
  { ip: '10.0.1.12',     bytes_total: 28_500_000, flow_count: 218, country: 'ET', is_anomalous: false },
  { ip: '45.33.32.156',  bytes_total: 18_700_000, flow_count: 94,  country: 'US', is_anomalous: true  },
  { ip: '192.168.1.100', bytes_total: 12_400_000, flow_count: 156, country: 'ET', is_anomalous: false },
  { ip: '104.21.55.12',  bytes_total: 9_100_000,  flow_count: 67,  country: 'CN', is_anomalous: true  },
];

export function TopTalkers({ data, loading }: TopTalkersProps) {
  const talkers = data.length > 0 ? data : MOCK_TALKERS;
  const maxBytes = Math.max(...talkers.map((t) => t.bytes_total));

  return (
    <GlassPanel tilt refract icon="📊" title="TOP TALKERS" style={{ height: '100%' }}>
      {loading ? (
        <LoadingState rows={5} height={18} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {talkers.map((talker, i) => (
            <div key={talker.ip}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      width: 14,
                      textAlign: 'right',
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.72rem',
                      color: talker.is_anomalous ? 'var(--critical)' : 'var(--text-primary)',
                      fontWeight: talker.is_anomalous ? 700 : 400,
                    }}
                  >
                    {talker.ip}
                  </span>
                  {talker.is_anomalous && (
                    <span style={{ fontSize: '0.55rem', color: 'var(--critical)' }}>⚠</span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {formatBytes(talker.bytes_total)}
                </span>
              </div>

              {/* Horizontal progress bar */}
              <div
                style={{
                  height: 4,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(talker.bytes_total / maxBytes) * 100}%`,
                    background: talker.is_anomalous
                      ? 'linear-gradient(90deg, var(--critical), var(--high))'
                      : 'linear-gradient(90deg, var(--cyan), var(--info))',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
