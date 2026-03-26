'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — TrafficTimeline
// Area chart showing packets/bytes over the last 60 min
// with red anomaly spike overlay
// Data: GET /api/v1/flows/stats?interval=1m (5s refresh)
// ═══════════════════════════════════════════════════════

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { GlassPanel } from '@/components/shared/GlassPanel';
import type { FlowTimeline } from '@/lib/types';
import { shortNumber } from '@/lib/utils';

interface TrafficTimelineProps {
  data: FlowTimeline[];
  loading?: boolean;
  /** Time window label shown in the badge */
  window?: '15 MIN' | '60 MIN' | '24H';
}

// Generate mock data when backend isn't connected
function generateMockStats(): FlowTimeline[] {
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => {
    const t    = new Date(now - (59 - i) * 60_000).toISOString();
    const base = 800 + Math.random() * 400;
    // Spike at index ~35 and ~50 to simulate anomalies
    const spike = (i === 35 || i === 50) ? base * 3.5 : 0;
    return {
      timestamp:          t,
      packets_per_second: Math.round(base + spike),
      bytes_per_second:   Math.round((base + spike) * 1400),
      active_flows:       Math.round(200 + Math.random() * 100),
      anomaly_count:      spike > 0 ? Math.round(3 + Math.random() * 5) : 0,
    };
  });
}

const MOCK_DATA = generateMockStats();

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontFamily: 'var(--font-data)',
      fontSize: '0.72rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {shortNumber(p.value)}
        </div>
      ))}
    </div>
  );
}

export function TrafficTimeline({ data, loading, window = '60 MIN' }: TrafficTimelineProps) {
  const chartData = data.length > 0 ? data : MOCK_DATA;

  // Find anomaly spikes for ReferenceLine markers
  const anomalyThreshold = (() => {
    const vals = chartData.map((d) => d.packets_per_second);
    const avg  = vals.reduce((a, b) => a + b, 0) / vals.length;
    return avg * 2.5;
  })();

  return (
    <GlassPanel
      tilt
      refract
      icon="📈"
      title="TRAFFIC TIMELINE"
      badge={window}
      style={{ height: '100%' }}
    >
      {loading ? (
        <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-sm)' }} />
      ) : (
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(195, 85%, 58%)"     stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(195, 85%, 58%)"     stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(0, 72%, 56%)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="timestamp"
                tick={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', fill: 'var(--text-muted)' }}
                tickFormatter={(val: string) => val.slice(11, 16)}
                interval={14}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', fill: 'var(--text-muted)' }}
                tickFormatter={(v: number) => shortNumber(v)}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Normal traffic area */}
              <Area
                type="monotone"
                dataKey="packets_per_second"
                name="pkts/s"
                stroke="var(--cyan)"
                strokeWidth={1.5}
                fill="url(#trafficGrad)"
                dot={false}
                activeDot={{ r: 3, fill: 'var(--cyan)', stroke: 'none' }}
              />

              {/* Anomaly spike overlay — only where anomaly_count > 0 */}
              <Area
                type="monotone"
                dataKey={(d: FlowTimeline) => d.anomaly_count > 0 ? d.packets_per_second : 0}
                name="anomaly"
                stroke="var(--critical)"
                strokeWidth={1}
                fill="url(#anomalyGrad)"
                dot={false}
                activeDot={false}
              />

              {/* Threshold reference line */}
              <ReferenceLine
                y={anomalyThreshold}
                stroke="var(--warning)"
                strokeDasharray="4 4"
                strokeWidth={1}
                opacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassPanel>
  );
}
