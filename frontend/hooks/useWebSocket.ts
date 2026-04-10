'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useWebSocket Hook
// Connects to the WebSocket singleton and exposes
// typed event state for use across all components
// ═══════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
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

export interface AnomalyDetectedEvent {
  flow_id: string;
  src_ip: string;
  dst_ip: string;
  anomaly_score: number;
  composite_score: number;
  severity: string;
  category: string;
  label: string;
  if_score?: number;
  ae_score?: number;
  rf_confidence?: number;
  model_agreement?: string;
  timestamp: string;
}

export interface MLMetricEvent {
  flow_id: string;
  preprocess_ms: number;
  if_ms: number;
  rf_ms: number;
  ae_ms: number;
  ensemble_ms: number;
  total_ms: number;
  severity: string;
  timestamp: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastFlowEvent: FlowEvent | null;
  lastAlertEvent: AlertEvent | null;
  lastAnomalyEvent: AnomalyDetectedEvent | null;
  lastMetricEvent: MLMetricEvent | null;
  systemStatus: SystemStatusEvent | null;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected]       = useState(false);
  const [lastFlowEvent, setLastFlowEvent]   = useState<FlowEvent | null>(null);
  const [lastAlertEvent, setLastAlertEvent] = useState<AlertEvent | null>(null);
  const [lastAnomalyEvent, setLastAnomalyEvent] = useState<AnomalyDetectedEvent | null>(null);
  const [lastMetricEvent, setLastMetricEvent] = useState<MLMetricEvent | null>(null);
  const [systemStatus, setSystemStatus]     = useState<SystemStatusEvent | null>(null);

  // Track unsubscribe functions per channel
  const unsubFunctionsRef = useRef<Map<string, () => void>>(new Map());

  const checkConnection = useCallback(() => {
    setIsConnected(wsClient.isConnected);
  }, []);

  const subscribe = useCallback((channels: string[]) => {
    // Subscribe to additional channels dynamically
    channels.forEach((channel) => {
      // Skip if already subscribed
      if (unsubFunctionsRef.current.has(channel)) return;

      let unsubFn: (() => void) | undefined;

      if (channel === WS_CHANNELS.FLOWS) {
        unsubFn = wsClient.subscribe(WS_CHANNELS.FLOWS, (d) => setLastFlowEvent(d as FlowEvent));
      } else if (channel === WS_CHANNELS.ALERTS) {
        unsubFn = wsClient.subscribe(WS_CHANNELS.ALERTS, (d) => setLastAlertEvent(d as AlertEvent));
      } else if (channel === WS_CHANNELS.SYSTEM) {
        unsubFn = wsClient.subscribe(WS_CHANNELS.SYSTEM, (d) => {
          setSystemStatus(d as SystemStatusEvent);
          checkConnection();
        });
      } else if (channel === WS_CHANNELS.METRICS) {
        unsubFn = wsClient.subscribe(WS_CHANNELS.METRICS, (d) => setLastMetricEvent((d as any).data.payload as MLMetricEvent));
      }

      // Store the unsubscribe function
      if (unsubFn) {
        unsubFunctionsRef.current.set(channel, unsubFn);
      }
    });
  }, [checkConnection]);

  const unsubscribe = useCallback((channels: string[]) => {
    channels.forEach((channel) => {
      const unsubFn = unsubFunctionsRef.current.get(channel);
      if (unsubFn) {
        unsubFn();
        unsubFunctionsRef.current.delete(channel);
      }
    });
  }, []);

  const reconnect = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    if (token) {
      wsClient.disconnect();
      wsClient.connect(token);
    }
  }, []);

  useEffect(() => {
    // Connect using stored token (or dev_mode placeholder)
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    const devToken = token || 'dev_mode_token';
    wsClient.connect(devToken);

    // Subscribe to all channels (will be sent once WS is open)
    const unsubFlows  = wsClient.subscribe(WS_CHANNELS.FLOWS,  (d) => {
      const flow = d as FlowEvent;
      console.log('[WS] Flow event:', { flowId: flow.id, src_ip: flow.src_ip, is_anomaly: flow.is_anomaly });
      setLastFlowEvent(flow);
    });
    const unsubAlerts = wsClient.subscribe(WS_CHANNELS.ALERTS, (d) => {
      const alert = d as AlertEvent;
      console.log('[WS] Alert event:', { alertId: alert.id, severity: alert.severity, category: alert.category });
      setLastAlertEvent(alert);
    });
    const unsubSystem = wsClient.subscribe(WS_CHANNELS.SYSTEM, (d) => {
      const status = d as SystemStatusEvent;
      console.log('[WS] System status:', status);
      setSystemStatus(status);
      checkConnection();
    });
    const unsubML     = wsClient.subscribe(WS_CHANNELS.ML,     (d) => {
      const anomaly = d as AnomalyDetectedEvent;
      console.log('[WS] Anomaly detected:', { flowId: anomaly.flow_id, score: anomaly.composite_score });
      setLastAnomalyEvent(anomaly);
    });
    const unsubMetrics = wsClient.subscribe(WS_CHANNELS.METRICS, (d: any) => {
      const metrics = d.data.payload as MLMetricEvent;
      console.log('[WS] ML Metrics received:', metrics);
      setLastMetricEvent(metrics);
    });

    // Store unsubscribe functions for dynamic unsubscribe support
    unsubFunctionsRef.current.set(WS_CHANNELS.FLOWS, unsubFlows);
    unsubFunctionsRef.current.set(WS_CHANNELS.ALERTS, unsubAlerts);
    unsubFunctionsRef.current.set(WS_CHANNELS.SYSTEM, unsubSystem);
    unsubFunctionsRef.current.set(WS_CHANNELS.ML, unsubML);
    unsubFunctionsRef.current.set(WS_CHANNELS.METRICS, unsubMetrics);

    // Poll connection state every 2 seconds
    const interval = setInterval(checkConnection, 2000);

    // Heartbeat: ping every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (wsClient.isConnected) {
        wsClient.ping();
      }
    }, 30000);

    return () => {
      unsubFlows();
      unsubAlerts();
      unsubSystem();
      unsubML();
      unsubMetrics();
      unsubFunctionsRef.current.clear();
      clearInterval(interval);
      clearInterval(heartbeatInterval);
    };
  }, [checkConnection]);

  return { isConnected, lastFlowEvent, lastAlertEvent, lastAnomalyEvent, lastMetricEvent, systemStatus, subscribe, unsubscribe, reconnect };
}
