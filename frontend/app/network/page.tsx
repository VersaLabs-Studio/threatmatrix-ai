'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Network Flow (v0.1.0)
// Full network flow analysis module:
//  • Mini metric cards (pkt/s, flows, anomaly rate)
//  • Protocol donut + Traffic timeline
//  • Flow table with anomaly filter + protocol filter
//  • Top Talkers + Geo Distribution
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useFlows }        from '@/hooks/useFlows';
import { useWebSocket }    from '@/hooks/useWebSocket';
import { MetricCard }      from '@/components/war-room/MetricCard';
import { ProtocolChart }   from '@/components/war-room/ProtocolChart';
import { TrafficTimeline } from '@/components/war-room/TrafficTimeline';
import { TopTalkers }      from '@/components/war-room/TopTalkers';
import { GeoDistribution } from '@/components/war-room/GeoDistribution';
import { GlassPanel }      from '@/components/shared/GlassPanel';
import { DataTable }       from '@/components/shared/DataTable';
import { StatusBadge }     from '@/components/shared/StatusBadge';
import { shortNumber, formatBytes, formatTime } from '@/lib/utils';
import type { NetworkFlow } from '@/hooks/useFlows';
import type { Severity }    from '@/lib/constants';

// ── Flow table columns ────────────────────────────────
const FLOW_COLS = [
  { key: 'timestamp', header: 'Time',     width: 90,  render: (r: NetworkFlow) => formatTime(r.timestamp) },
  { key: 'src_ip',    header: 'Src IP',   width: 130 },
  { key: 'dst_ip',    header: 'Dst IP',   width: 130 },
  { key: 'protocol',  header: 'Proto',    width: 60  },
  {
    key: 'src_bytes', header: 'Bytes',    width: 80,
    render: (r: NetworkFlow) => formatBytes(r.src_bytes + r.dst_bytes),
  },
  {
    key: 'anomaly_score', header: 'Score', width: 70,
    render: (r: NetworkFlow) => (
      <span style={{ color: r.anomaly_score > 0.7 ? '#ef4444' : r.anomaly_score > 0.4 ? '#f59e0b' : '#22c55e' }}>
        {(r.anomaly_score * 100).toFixed(0)}%
      </span>
    ),
  },
  {
    key: 'is_anomaly', header: 'Status', width: 90,
    render: (r: NetworkFlow) => (
      <StatusBadge
        severity={r.is_anomaly ? (r.anomaly_score > 0.8 ? 'critical' : 'high') : 'info' as Severity}
        label={r.is_anomaly ? 'ANOMALY' : 'NORMAL'}
      />
    ),
  },
];

// Mock flows for demonstration
const MOCK_FLOWS: NetworkFlow[] = [
  { id: 'm1', src_ip: '10.0.1.5',     dst_ip: '104.21.55.12', src_port: 45231, dst_port: 443,  protocol: 'TCP',  duration: 12.4,  src_bytes: 248000,  dst_bytes: 18400,  total_packets: 320,  anomaly_score: 0.94, is_anomaly: true,  label: 'C2 Communication',  timestamp: new Date(Date.now()-60000).toISOString()  },
  { id: 'm2', src_ip: '185.220.101.4', dst_ip: '10.0.1.5',    src_port: 1234,  dst_port: 22,   protocol: 'TCP',  duration: 8.1,   src_bytes: 5200,    dst_bytes: 2100,   total_packets: 48,   anomaly_score: 0.88, is_anomaly: true,  label: 'SSH Brute Force',   timestamp: new Date(Date.now()-120000).toISOString() },
  { id: 'm3', src_ip: '10.0.1.12',    dst_ip: '10.0.1.5',    src_port: 3000,  dst_port: 8080, protocol: 'TCP',  duration: 0.3,   src_bytes: 1200,    dst_bytes: 800,    total_packets: 12,   anomaly_score: 0.08, is_anomaly: false, label: 'Normal',            timestamp: new Date(Date.now()-150000).toISOString() },
  { id: 'm4', src_ip: '45.33.32.156',  dst_ip: '10.0.1.5',    src_port: 49200, dst_port: 53,   protocol: 'UDP',  duration: 120.0, src_bytes: 145200,  dst_bytes: 86400,  total_packets: 1840, anomaly_score: 0.81, is_anomaly: true,  label: 'DNS Tunneling',     timestamp: new Date(Date.now()-200000).toISOString() },
  { id: 'm5', src_ip: '10.0.1.23',    dst_ip: '8.8.8.8',     src_port: 52100, dst_port: 53,   protocol: 'UDP',  duration: 0.1,   src_bytes: 120,     dst_bytes: 160,    total_packets: 2,    anomaly_score: 0.12, is_anomaly: false, label: 'Normal',            timestamp: new Date(Date.now()-240000).toISOString() },
  { id: 'm6', src_ip: '10.0.1.5',     dst_ip: '192.168.1.1', src_port: 60000, dst_port: 80,   protocol: 'TCP',  duration: 0.5,   src_bytes: 840,     dst_bytes: 4200,   total_packets: 8,    anomaly_score: 0.06, is_anomaly: false, label: 'Normal',            timestamp: new Date(Date.now()-280000).toISOString() },
  { id: 'm7', src_ip: '203.0.113.42',  dst_ip: '10.0.1.8',    src_port: 45000, dst_port: 8080, protocol: 'TCP',  duration: 35.2,  src_bytes: 980000,  dst_bytes: 24000,  total_packets: 1120, anomaly_score: 0.76, is_anomaly: true,  label: 'Data Exfiltration', timestamp: new Date(Date.now()-310000).toISOString() },
  { id: 'm8', src_ip: '10.0.1.5',     dst_ip: '10.0.0.1',    src_port: 34000, dst_port: 161,  protocol: 'UDP',  duration: 0.02,  src_bytes: 84,      dst_bytes: 120,    total_packets: 2,    anomaly_score: 0.03, is_anomaly: false, label: 'Normal',            timestamp: new Date(Date.now()-360000).toISOString() },
];

const PROTOCOLS = ['ALL', 'TCP', 'UDP', 'ICMP'];
const ANOMALY_FILTERS = ['ALL', 'ANOMALY', 'NORMAL'];

export default function NetworkFlowPage() {
  const { systemStatus } = useWebSocket();
  const { flows, stats, protocols, topTalkers, loading } = useFlows({ time_range: '1h', limit: 100 });

  const [protoFilter,   setProtoFilter]   = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [search,        setSearch]        = useState('');

  // Merge live + mock flows
  const allFlows = flows.length > 0 ? flows : MOCK_FLOWS;

  // Apply filters
  const filtered = allFlows.filter((f) => {
    if (protoFilter !== 'ALL'   && f.protocol !== protoFilter)           return false;
    if (anomalyFilter === 'ANOMALY' && !f.is_anomaly)                    return false;
    if (anomalyFilter === 'NORMAL'  &&  f.is_anomaly)                    return false;
    if (search && !f.src_ip.includes(search) && !f.dst_ip.includes(search)) return false;
    return true;
  });

  const pps   = systemStatus?.packets_per_second ?? (stats[stats.length - 1]?.packets_per_second ?? 0);
  const fCnt  = systemStatus?.active_flows       ?? (stats[stats.length - 1]?.active_flows       ?? 0);
  const anomalyCount = allFlows.filter((f) => f.is_anomaly).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* ── Page title ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.1rem' }}>📡</span>
        <div>
          <h1 style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.12em', margin: 0 }}>
            NETWORK FLOW ANALYSIS
          </h1>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
            Real-time capture · {allFlows.length} flows in view
          </p>
        </div>
      </div>

      {/* ── Row 1: Metric cards ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        <MetricCard label="PACKETS/SEC"  value={pps}          unit="pkt/s"  accent="cyan"     loading={loading} />
        <MetricCard label="ACTIVE FLOWS" value={fCnt}         unit="flows"  accent="cyan"     loading={loading} />
        <MetricCard label="ANOMALIES"    value={anomalyCount} unit="flows"  accent="critical" loading={loading} />
        <MetricCard label="TOTAL BYTES"  value={allFlows.reduce((s, f) => s + f.src_bytes + f.dst_bytes, 0)}
          unit="B" accent="info" loading={loading}
        />
      </div>

      {/* ── Row 2: Charts ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-4)' }}>
        <TrafficTimeline data={stats}    loading={loading} />
        <ProtocolChart   data={protocols} loading={loading} />
      </div>

      {/* ── Row 3: Flow table ───────────────────────── */}
      <GlassPanel static icon="📋" title="FLOW TABLE" badge={`${filtered.length} / ${allFlows.length}`}>
        {/* Filters row */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
          {/* IP search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by IP…"
            style={{
              flex: '1 1 160px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontFamily: 'var(--font-data)',
              fontSize: '0.72rem',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />

          {/* Protocol filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {PROTOCOLS.map((p) => (
              <button
                key={p}
                onClick={() => setProtoFilter(p)}
                style={{
                  padding: '4px 10px',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.65rem',
                  border: `1px solid ${protoFilter === p ? 'var(--cyan)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: protoFilter === p ? 'var(--cyan-muted)' : 'var(--bg-tertiary)',
                  color: protoFilter === p ? 'var(--cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Anomaly filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {ANOMALY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setAnomalyFilter(f)}
                style={{
                  padding: '4px 10px',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.65rem',
                  border: `1px solid ${anomalyFilter === f ? 'var(--warning)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: anomalyFilter === f ? 'rgba(245,158,11,0.08)' : 'var(--bg-tertiary)',
                  color: anomalyFilter === f ? 'var(--warning)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={FLOW_COLS}
          data={filtered}
          loading={loading}
          rowKey={(r) => String(r.id)}
          maxHeight={320}
          emptyMessage="No flows match the current filters"
        />
      </GlassPanel>

      {/* ── Row 4: Top Talkers + Geo ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <TopTalkers    data={topTalkers} loading={loading} />
        <GeoDistribution />
      </div>
    </div>
  );
}
