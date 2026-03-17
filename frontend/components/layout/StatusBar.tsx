'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — StatusBar
// 32px footer: live system health indicators + UTC time
// ═══════════════════════════════════════════════════════

import { useWebSocket } from '@/hooks/useWebSocket';
import { APP_VERSION } from '@/lib/constants';

interface StatusItemProps {
  label: string;
  active: boolean;
  activeColor?: string;
}

function StatusItem({ label, active, activeColor = '#22c55e' }: StatusItemProps) {
  return (
    <div className="statusItem" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: active ? activeColor : 'var(--text-muted)',
          animation: active ? 'pulse 2s ease-in-out infinite' : undefined,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}


export function StatusBar() {
  const { systemStatus, isConnected } = useWebSocket();

  const capture  = systemStatus?.capture_active  ?? false;
  const ml       = systemStatus?.ml_active        ?? false;
  const intel    = systemStatus?.intel_synced     ?? false;
  const llm      = systemStatus?.llm_online       ?? false;
  const pps      = systemStatus?.packets_per_second ?? 0;
  const flows    = systemStatus?.active_flows     ?? 0;

  return (
    <footer className="statusbar">
      <StatusItem label={`CAPTURE: ${capture ? "LIVE" : "IDLE"}`} active={capture} />
      <StatusItem label={`ML: ${ml ? "ACTIVE" : "STANDBY"}`} active={ml} />
      <StatusItem label={`INTEL: ${intel ? "SYNCED" : "DISCONNECTED"}`} active={intel} />
      <StatusItem label={`LLM: ${llm ? "ONLINE" : "OFFLINE"}`} active={llm} />

      {capture && (
        <>
          <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />
          <span>{pps.toLocaleString()} pkt/s</span>
          <span>{flows.toLocaleString()} flows</span>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* WebSocket connectivity indicator */}
      <StatusItem
        label={isConnected ? "WS CONNECTED" : "WS RECONNECTING..."}
        active={isConnected}
        activeColor="var(--cyan)"
      />

      {/* Version */}
      <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />
      <span style={{ color: 'var(--cyan)' }}>{APP_VERSION}</span>
    </footer>
  );
}
