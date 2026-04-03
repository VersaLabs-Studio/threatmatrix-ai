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

// No mock data — uses real API data from /api/v1/flows/top-talkers
export function TopTalkers({ data, loading }: TopTalkersProps) {
  const talkers = data.length > 0 ? data : [];
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
