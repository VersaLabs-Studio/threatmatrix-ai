'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — ProtocolChart
// Animated donut chart showing protocol distribution
// Data: GET /api/v1/flows/protocols (10s refresh)
// ═══════════════════════════════════════════════════════

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';
import { GlassPanel }  from '@/components/shared/GlassPanel';
import { LoadingState } from '@/components/shared/LoadingState';
import type { ProtocolStats } from '@/hooks/useFlows';

interface ProtocolChartProps {
  data: ProtocolStats[];
  loading?: boolean;
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP:   'hsl(195, 85%, 58%)',
  UDP:   'hsl(217, 80%, 60%)',
  ICMP:  'hsl(40, 92%, 56%)',
  OTHER: 'hsl(228, 20%, 45%)',
};

const DEFAULT_COLORS = [
  'hsl(195, 85%, 58%)',
  'hsl(217, 80%, 60%)',
  'hsl(40, 92%, 56%)',
  'hsl(152, 60%, 48%)',
  'hsl(0, 72%, 56%)',
  'hsl(25, 90%, 55%)'
];

const MOCK_DATA: ProtocolStats[] = [
  { protocol: 'TCP',   count: 6200, percent: 62 },
  { protocol: 'UDP',   count: 2400, percent: 24 },
  { protocol: 'ICMP',  count: 800,  percent: 8  },
  { protocol: 'OTHER', count: 600,  percent: 6  },
];

function CustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    cx === undefined || cy === undefined ||
    midAngle === undefined || innerRadius === undefined ||
    outerRadius === undefined || percent === undefined ||
    Number(percent) < 0.05
  ) return null;

  const RADIAN = Math.PI / 180;
  const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN);

  return (
    <text
      x={x} y={y}
      fill="var(--text-primary)"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', fontWeight: 600 }}
    >
      {`${(Number(percent) * 100).toFixed(0)}%`}
    </text>
  );
}

export function ProtocolChart({ data, loading }: ProtocolChartProps) {
  const chartData = data.length > 0 ? data : MOCK_DATA;

  return (
    <GlassPanel tilt refract icon="📡" title="PROTOCOL DISTRIBUTION" style={{ height: '100%' }}>
      {loading ? (
        <LoadingState rows={3} height={14} />
      ) : (
        <div
          style={{ width: '100%', height: 150, transition: 'transform 0.3s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="percent"
                nameKey="protocol"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={62}
                strokeWidth={0}
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.protocol}
                    fill={PROTOCOL_COLORS[entry.protocol] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                    opacity={0.85}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {chartData.map((entry, i) => (
          <div key={entry.protocol} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: PROTOCOL_COLORS[entry.protocol] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
              }}
            />
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', width: '3rem' }}>
              {entry.protocol}
            </span>
            <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${entry.percent}%`,
                  height: '100%',
                  background: PROTOCOL_COLORS[entry.protocol] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                  borderRadius: 999,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', width: '2.5rem', textAlign: 'right' }}>
              {entry.percent}%
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
