'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — FlowDetailPanel
// Detailed view of a network flow with ML analysis
// ═══════════════════════════════════════════════════════

import { X } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import type { NetworkFlow } from '@/hooks/useFlows';
import { formatBytes, formatTime } from '@/lib/utils';

interface FlowDetailPanelProps {
  flow: NetworkFlow;
  onClose: () => void;
}

export function FlowDetailPanel({ flow, onClose }: FlowDetailPanelProps) {
  return (
    <GlassPanel static>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontFamily: 'var(--font-data)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan)', margin: 0 }}>
          FLOW DETAIL — {flow.src_ip}:{flow.src_port} → {flow.dst_ip}:{flow.dst_port}
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Left: Flow Metadata */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>METADATA</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MetaRow label="Timestamp" value={formatTime(flow.timestamp)} />
            <MetaRow label="Protocol" value={flow.protocol} />
            <MetaRow label="Duration" value={`${flow.duration?.toFixed(2) || '—'}s`} />
            <MetaRow label="Total Bytes" value={formatBytes((flow.src_bytes || 0) + (flow.dst_bytes || 0))} />
            <MetaRow label="Packets" value={String(flow.total_packets || '—')} />
            <MetaRow label="Source" value={`${flow.src_ip}:${flow.src_port}`} />
            <MetaRow label="Destination" value={`${flow.dst_ip}:${flow.dst_port}`} />
          </div>
        </div>

        {/* Right: ML Scores */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>ML ANALYSIS</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MetaRow label="Anomaly Score" value={`${((flow.anomaly_score || 0) * 100).toFixed(1)}%`} accent={flow.is_anomaly ? 'critical' : 'safe'} />
            <MetaRow label="Status" value={flow.is_anomaly ? '⚠️ ANOMALY' : '✅ NORMAL'} accent={flow.is_anomaly ? 'critical' : 'safe'} />
            <MetaRow label="Label" value={flow.label || '—'} />
            <MetaRow label="ML Model" value={flow.ml_model || 'ensemble'} />
            <MetaRow label="Source" value={flow.source} />
          </div>

          {/* Anomaly Score Gauge */}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>ANOMALY GAUGE</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {((flow.anomaly_score || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${(flow.anomaly_score || 0) * 100}%`,
                height: '100%',
                background: flow.is_anomaly
                  ? 'linear-gradient(90deg, var(--warning), var(--critical))'
                  : 'linear-gradient(90deg, var(--safe), var(--cyan))',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function MetaRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: accent ? `var(--${accent})` : 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}