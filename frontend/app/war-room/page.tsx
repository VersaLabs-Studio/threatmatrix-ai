'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — War Room (v0.6.0)
// The primary operational command view.
// Deck.gl ThreatMap loaded dynamically (browser-only WebGL)
// Fixed: Metrics now use API data instead of WebSocket (DEV_MODE compatible)
// ═══════════════════════════════════════════════════

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket }      from '@/hooks/useWebSocket';
import { useFlows }          from '@/hooks/useFlows';
import { useAlerts }         from '@/hooks/useAlerts';
import { useMLModels }       from '@/hooks/useMLModels';
import { api }               from '@/lib/api';
import { MetricCard }        from '@/components/war-room/MetricCard';
import { ProtocolChart }     from '@/components/war-room/ProtocolChart';
import { TrafficTimeline }   from '@/components/war-room/TrafficTimeline';
import { LiveAlertFeed }     from '@/components/war-room/LiveAlertFeed';
import { TopTalkers }        from '@/components/war-room/TopTalkers';
import { AIBriefingWidget }  from '@/components/war-room/AIBriefingWidget';
import { GeoDistribution }   from '@/components/war-room/GeoDistribution';
import { SystemStatusCard }  from '@/components/war-room/SystemStatusCard';
import { ProtocolCard }      from '@/components/war-room/ProtocolCard';
import { TrafficTimelineCard } from '@/components/war-room/TrafficTimelineCard';
import { ThreatLevelCard }   from '@/components/war-room/ThreatLevelCard';
import { formatPercent, shortNumber } from '@/lib/utils';
import { AuthGuard }         from '@/components/auth/AuthGuard';

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

// ── Capture status type ──────────────────────────────────
interface CaptureStatus {
  status: string;
  interface: string | null;
  packets_captured: number;
  flows_completed: number;
  flows_published: number;
  publish_errors: number;
  active_flows: number;
  uptime_seconds: number;
}

export default function WarRoomPage() {
  const { lastAlertEvent, lastAnomalyEvent, isConnected: wsConnected } = useWebSocket();
  const { stats, protocols, topTalkers, loading: flowsLoading } = useFlows({ time_range: '1h' });
  const { alerts, total: alertTotal, loading: alertsLoading } = useAlerts({ limit: 100 });
  const { trainedCount, loading: mlLoading } = useMLModels();

  // Alert stats for accurate threat level computation
  // API returns: { time_range, total, by_severity: { critical, high, medium, low, info }, by_status, by_category }
  const [alertStats, setAlertStats] = useState<{ critical?: number; high?: number; medium?: number; low?: number; info?: number; by_severity?: { critical: number; high: number; medium: number; low: number; info: number }; total: number } | null>(null);
  
  // Capture status for live metrics
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);

  // Fetch alert stats
  const fetchAlertStats = useCallback(async () => {
    try {
      const { data } = await api.get<{ critical?: number; high?: number; medium?: number; low?: number; by_severity?: { critical: number; high: number; medium: number; low: number; info: number }; total: number }>('/api/v1/alerts/stats');
      console.log('[WarRoom] Alert stats response:', data);
      if (data) setAlertStats(data);
    } catch (e) {
      console.error('[WarRoom] Failed to fetch alert stats:', e);
    }
  }, []);

  // Fetch capture status
  const fetchCaptureStatus = useCallback(async () => {
    try {
      const { data } = await api.get<CaptureStatus>('/api/v1/capture/status');
      console.log('[WarRoom] Capture status response:', data);
      if (data) setCaptureStatus(data);
    } catch (e) {
      console.error('[WarRoom] Failed to fetch capture status:', e);
    }
  }, []);

  useEffect(() => {
    fetchAlertStats();
    fetchCaptureStatus();
    const alertInterval = setInterval(fetchAlertStats, 10000);
    const captureInterval = setInterval(fetchCaptureStatus, 5000);
    return () => {
      clearInterval(alertInterval);
      clearInterval(captureInterval);
    };
  }, [fetchAlertStats, fetchCaptureStatus]);

  // Derive live metric values from API data (not WebSocket)
  const totalPackets = stats?.total_packets ?? 0;
  const totalFlows = stats?.total_flows ?? captureStatus?.flows_completed ?? 0;
  const anomalyCount = stats?.anomaly_count ?? 0;
  
  // Debug logging
  console.log('[WarRoom] Stats:', stats);
  console.log('[WarRoom] Capture status:', captureStatus);
  console.log('[WarRoom] Alert stats:', alertStats);
  
  // Calculate packets per second from total packets over 1 hour interval
  const pps = totalPackets > 0 ? Math.round(totalPackets / 3600) : 0;
  const flows = totalFlows;

  // Compute anomaly rate from alert stats
  // API returns: { by_severity: { critical, high, medium, low, info }, total }
  const severityCounts = alertStats?.by_severity ?? { critical: alertStats?.critical ?? 0, high: alertStats?.high ?? 0, medium: alertStats?.medium ?? 0, low: alertStats?.low ?? 0, info: alertStats?.info ?? 0 };
  const totalAlerts = severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low;
  
  // Guard against division by zero and NaN
  const anomalyRate = totalFlows > 0 && totalAlerts > 0
    ? totalAlerts / totalFlows
    : 0;
  
  console.log('[WarRoom] Computed metrics:', { pps, flows, totalAlerts, anomalyRate });

  // Calculate threat level from ML alert distribution
  const sevCounts = alertStats?.by_severity ?? { critical: alertStats?.critical ?? 0, high: alertStats?.high ?? 0, medium: alertStats?.medium ?? 0, low: alertStats?.low ?? 0, info: alertStats?.info ?? 0 };
  const threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'SAFE' =
    sevCounts.critical > 0 ? 'CRITICAL' :
    sevCounts.high > 3 ? 'HIGH' :
    sevCounts.medium > 10 ? 'ELEVATED' :
    'SAFE';

  return (
    <AuthGuard>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          minHeight: '100%',
        }}
      >
        {/* ── Row 1: Metric Cards ───────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)' }}>
          <MetricCard
            label="PACKETS/SEC"
            value={shortNumber(pps)}
            unit="pkt/s"
            accent="cyan"
            loading={flowsLoading}
          />
          <MetricCard
            label="ACTIVE FLOWS"
            value={shortNumber(flows)}
            unit="flows"
            accent="cyan"
            loading={flowsLoading}
          />
          <MetricCard
            label="ANOMALY RATE"
            value={parseFloat(formatPercent(anomalyRate))}
            unit="%"
            accent={anomalyRate > 0.05 ? 'critical' : anomalyRate > 0 ? 'warning' : 'safe'}
            loading={flowsLoading}
          />
          <MetricCard
            label="THREATS (24H)"
            value={alertTotal}
            unit="alerts"
            accent="critical"
            loading={alertsLoading}
          />
          <MetricCard
            label="ML MODELS"
            value={`${trainedCount}/3`}
            unit="active"
            accent="cyan"
            loading={mlLoading}
          />
        </div>

        {/* ── Row 2: Full-width Threat Map ──────────────── */}
        <div
          className="glass-panel-static"
          style={{ display: 'flex', flexDirection: 'column', height: 420 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-2)', padding: '0 var(--space-4)' }}>
            <span style={{ fontSize: '1rem' }}>🌐</span>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)',
              fontWeight: 600, color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1,
            }}>
              LIVE THREAT MAP
            </span>
            <span className={`status-dot ${captureStatus?.status === 'running' ? 'status-dot--live' : 'status-dot--idle'}`} />
          </div>
          <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', minHeight: 0 }}>
            <ThreatMap />
          </div>
        </div>

        {/* ── Row 3: AI Briefing + System Status ────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
          <AIBriefingWidget />
          <SystemStatusCard />
        </div>

        {/* ── Row 4: Alert Feed + Top Talkers + Geo ────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <LiveAlertFeed lastAlertEvent={lastAlertEvent} lastAnomalyEvent={lastAnomalyEvent} />
          <TopTalkers data={topTalkers} loading={flowsLoading} />
          <GeoDistribution />
        </div>

        {/* ── Row 5: Protocol + Timeline + Threat Level ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--space-4)' }}>
          <ProtocolCard data={protocols} loading={flowsLoading} />
          <TrafficTimelineCard data={[]} loading={flowsLoading} />
          <ThreatLevelCard level={threatLevel} alertStats={sevCounts} loading={alertsLoading} />
        </div>
      </div>
    </AuthGuard>
  );
}
