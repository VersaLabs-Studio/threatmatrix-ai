'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — TrafficTimelineCard
// Enterprise traffic timeline display
// ═══════════════════════════════════════════════════════

import { GlassPanel } from '@/components/shared/GlassPanel';
import { TrendingUp, Clock } from 'lucide-react';

interface TimelinePoint {
  time: string;
  flows: number;
  anomalies: number;
}

// Stable demo data (no random)
const DEMO_TIMELINE: TimelinePoint[] = [
  { time: '17:00', flows: 800, anomalies: 12 },
  { time: '17:05', flows: 1200, anomalies: 25 },
  { time: '17:10', flows: 950, anomalies: 8 },
  { time: '17:15', flows: 1500, anomalies: 42 },
  { time: '17:20', flows: 1100, anomalies: 18 },
  { time: '17:25', flows: 1800, anomalies: 35 },
  { time: '17:30', flows: 1400, anomalies: 22 },
  { time: '17:35', flows: 1600, anomalies: 28 },
  { time: '17:40', flows: 1300, anomalies: 15 },
  { time: '17:45', flows: 1700, anomalies: 38 },
  { time: '17:50', flows: 1450, anomalies: 20 },
  { time: '17:55', flows: 1550, anomalies: 30 },
];

interface TrafficTimelineCardProps {
  data: TimelinePoint[];
  loading?: boolean;
}

export function TrafficTimelineCard({ data, loading }: TrafficTimelineCardProps) {
  const timelineData = data.length > 0 ? data : DEMO_TIMELINE;
  
  if (loading) {
    return (
      <GlassPanel icon="📈" title="TRAFFIC TIMELINE" badge="Loading...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Loading timeline...
          </span>
        </div>
      </GlassPanel>
    );
  }

  const maxFlows = Math.max(...timelineData.map(d => d.flows));
  const totalFlows = timelineData.reduce((sum, d) => sum + d.flows, 0);
  const totalAnomalies = timelineData.reduce((sum, d) => sum + d.anomalies, 0);

  return (
    <GlassPanel icon="📈" title="TRAFFIC TIMELINE" badge="60 min">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Timeline bars */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: 4, 
          height: 80,
          padding: '0 4px',
        }}>
          {timelineData.map((point, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${(point.flows / maxFlows) * 100}%`,
                background: point.anomalies > 30 
                  ? 'linear-gradient(to top, var(--cyan), var(--critical))' 
                  : 'var(--cyan)',
                borderRadius: '2px 2px 0 0',
                opacity: 0.7 + (i / timelineData.length) * 0.3,
                transition: 'height 0.3s ease',
                position: 'relative',
              }}
              title={`${point.time}: ${point.flows} flows, ${point.anomalies} anomalies`}
            />
          ))}
        </div>

        {/* Time labels */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '0 4px',
        }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>
            {timelineData[0]?.time}
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>
            {timelineData[timelineData.length - 1]?.time}
          </span>
        </div>

        {/* Summary footer */}
        <div style={{
          marginTop: 4,
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--cyan-muted)',
          border: '1px solid var(--cyan-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={12} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'var(--cyan)' }}>
              {totalFlows.toLocaleString()} flows
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} style={{ color: 'var(--warning)' }} />
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'var(--warning)' }}>
              {totalAnomalies} anomalies
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
