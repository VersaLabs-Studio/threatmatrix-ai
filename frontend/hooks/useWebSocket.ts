'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useWebSocket Hook
// Connects to the WebSocket singleton and exposes
// typed event state for use across all components
// ═══════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react';
import { wsClient } from '@/lib/websocket';
import { WS_CHANNELS, type ThreatLevel } from '@/lib/constants';

// ── Typed event shapes from the backend ────────────────

export interface FlowEvent {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_lat?: number;
  src_lon?: number;
  dst_lat?: number;
  dst_lon?: number;
  protocol: string;
  bytes: number;
  anomaly_score: number;
  is_anomaly: boolean;
  label: string;
  timestamp: string;
}

export interface AlertEvent {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  src_ip: string;
  dst_ip: string;
  composite_score: number;
  timestamp: string;
  status: string;
}

export interface SystemStatusEvent {
  capture_active: boolean;
  ml_active: boolean;
  intel_synced: boolean;
  llm_online: boolean;
  threat_level: ThreatLevel;
  packets_per_second: number;
  active_flows: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastFlowEvent: FlowEvent | null;
  lastAlertEvent: AlertEvent | null;
  systemStatus: SystemStatusEvent | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected]       = useState(false);
  const [lastFlowEvent, setLastFlowEvent]   = useState<FlowEvent | null>(null);
  const [lastAlertEvent, setLastAlertEvent] = useState<AlertEvent | null>(null);
  const [systemStatus, setSystemStatus]     = useState<SystemStatusEvent | null>(null);

  const checkConnection = useCallback(() => {
    setIsConnected(wsClient.isConnected);
  }, []);

  useEffect(() => {
    // Subscribe to all channels
    const unsubFlows  = wsClient.subscribe(WS_CHANNELS.FLOWS,  (d) => setLastFlowEvent(d as FlowEvent));
    const unsubAlerts = wsClient.subscribe(WS_CHANNELS.ALERTS, (d) => setLastAlertEvent(d as AlertEvent));
    const unsubSystem = wsClient.subscribe(WS_CHANNELS.SYSTEM, (d) => {
      setSystemStatus(d as SystemStatusEvent);
      checkConnection();
    });

    // Poll connection state every 2 seconds
    const interval = setInterval(checkConnection, 2000);

    // Connect using stored token (if available)
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    if (token) wsClient.connect(token);

    return () => {
      unsubFlows();
      unsubAlerts();
      unsubSystem();
      clearInterval(interval);
    };
  }, [checkConnection]);

  return { isConnected, lastFlowEvent, lastAlertEvent, systemStatus };
}
