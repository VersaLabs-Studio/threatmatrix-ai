'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — War Room (v0.3.0)
// The primary operational command view.
// Deck.gl ThreatMap loaded dynamically (browser-only WebGL)
// ═══════════════════════════════════════════════════════

import dynamic from 'next/dynamic';
import { useWebSocket }      from '@/hooks/useWebSocket';
import { useFlows }          from '@/hooks/useFlows';
import { MetricCard }        from '@/components/war-room/MetricCard';
import { ProtocolChart }     from '@/components/war-room/ProtocolChart';
import { TrafficTimeline }   from '@/components/war-room/TrafficTimeline';
import { LiveAlertFeed }     from '@/components/war-room/LiveAlertFeed';
import { TopTalkers }        from '@/components/war-room/TopTalkers';
import { AIBriefingWidget }  from '@/components/war-room/AIBriefingWidget';
import { GeoDistribution }   from '@/components/war-room/GeoDistribution';
import { formatPercent }     from '@/lib/utils';

// Dynamic import ensures Deck.gl never runs at SSR time
const ThreatMap = dynamic(
  () => import('@/components/war-room/ThreatMap').then((m) => m.ThreatMap),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.75rem', color: '#00f0ff',
        letterSpacing: '0.1em',
      }}>
        LOADING THREAT MAP…
      </div>
    ),
  }
);


export default function WarRoomPage() {
  const { lastAlertEvent, systemStatus, recentFlows } = useWebSocket();
  const { stats, protocols, topTalkers, loading } = useFlows({ time_range: '1h' });

  // Derive live metric values from system status or the latest stats point
  const latestStat = stats[stats.length - 1];
  const pps        = systemStatus?.packets_per_second ?? latestStat?.packets_per_second ?? 0;
  const flows      = systemStatus?.active_flows       ?? latestStat?.active_flows       ?? 0;

  // Compute anomaly rate from stats array
  const totalPackets  = stats.reduce((s: number, d) => s + d.packets_per_second, 0);
  const anomalyPkts   = stats.reduce((s: number, d) => s + d.anomaly_count, 0);
  const anomalyRate   = totalPackets > 0 ? anomalyPkts / totalPackets : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)', minHeight: '100%' }}>
      {/* ── Row 1: Metric Cards ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        <MetricCard label="PACKETS/SEC"  value={pps}          unit="pkt/s"  accent="cyan"     loading={loading} />
        <MetricCard label="ACTIVE FLOWS" value={flows}        unit="flows"  accent="cyan"     loading={loading} />
        <MetricCard 
          label="ANOMALY RATE" 
          value={parseFloat(formatPercent(anomalyRate))} 
          unit="%" 
          accent={anomalyRate > 0.05 ? 'critical' : 'warning'} 
          loading={loading} 
        />
        <MetricCard 
          label="THREAT EVENTS" 
          value={stats.reduce((s: number, d) => s + d.anomaly_count, 0)} 
          unit="alerts" 
          accent="critical" 
          loading={loading} 
        />
      </div>

      {/* ── Row 2: Threat Map + Protocols + Timeline ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-4)', flex: 1 }}>
        <div
          className="glass-panel-static"
          style={{ display: 'flex', flexDirection: 'column', minHeight: 380 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: '1rem' }}>🌐</span>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)',
              fontWeight: 600, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1,
            }}>
              THREAT MAP
            </span>
            <span className="status-dot status-dot--live" />
          </div>
          <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', minHeight: 320 }}>
            <ThreatMap recentFlows={recentFlows} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <ProtocolChart data={protocols} loading={loading} />
          <TrafficTimeline data={stats} loading={loading} />
        </div>
      </div>

      {/* ── Row 3: AI Briefing ────────────────────────── */}
      <AIBriefingWidget />

      {/* ── Row 4: Alert Feed + Top Talkers + Geo ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
        <LiveAlertFeed   lastAlertEvent={lastAlertEvent} />
        <TopTalkers      data={topTalkers} loading={loading} />
        <GeoDistribution />
      </div>
    </div>
  );
}
