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
  label: string;
  timestamp: string;
}

interface FlowStats {
  total_packets: number;
  total_flows: number;
  anomaly_count: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastFlowEvent: FlowEvent | null;
  lastAlertEvent: AlertEvent | null;
  lastAnomalyEvent: AnomalyDetectedEvent | null;
  systemStatus: SystemStatusEvent | null;
  flowEvents: FlowEvent[];
  alertEvents: AlertEvent[];
  flowStats: FlowStats;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected]       = useState(false);
  const [lastFlowEvent, setLastFlowEvent]   = useState<FlowEvent | null>(null);
  const [lastAlertEvent, setLastAlertEvent] = useState<AlertEvent | null>(null);
  const [lastAnomalyEvent, setLastAnomalyEvent] = useState<AnomalyDetectedEvent | null>(null);
  const [systemStatus, setSystemStatus]     = useState<SystemStatusEvent | null>(null);
  const [flowEvents, setFlowEvents]         = useState<FlowEvent[]>([]);
  const [alertEvents, setAlertEvents]       = useState<AlertEvent[]>([]);
  const [flowStats, setFlowStats]           = useState<FlowStats>({ total_packets: 0, total_flows: 0, anomaly_count: 0 });

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
        unsubFn = wsClient.subscribe(WS_CHANNELS.FLOWS, (d) => {
          const flow = d as FlowEvent;
          console.log('[WS] Flow event received:', { flowId: flow.id, src_ip: flow.src_ip, is_anomaly: flow.is_anomaly });
          setLastFlowEvent(flow);
          setFlowEvents((prev) => {
            const updated = [flow, ...prev].slice(0, 1000);
            console.log('[WS] Flow events accumulated:', updated.length);
            return updated;
          });
          setFlowStats((prev) => {
            const next = {
              total_packets: prev.total_packets + 1,
              total_flows: prev.total_flows + 1,
              anomaly_count: prev.anomaly_count + (flow.is_anomaly ? 1 : 0),
            };
            console.log('[WS] Flow stats updated:', next);
            return next;
          });
        });
      } else if (channel === WS_CHANNELS.ALERTS) {
        unsubFn = wsClient.subscribe(WS_CHANNELS.ALERTS, (d) => {
          const alert = d as AlertEvent;
          console.log('[WS] Alert event received:', { alertId: alert.id, severity: alert.severity, category: alert.category });
          setLastAlertEvent(alert);
          setAlertEvents((prev) => {
            const updated = [alert, ...prev].slice(0, 500);
            console.log('[WS] Alert events accumulated:', updated.length);
            return updated;
          });
        });
      } else if (channel === WS_CHANNELS.SYSTEM) {
        unsubFn = wsClient.subscribe(WS_CHANNELS.SYSTEM, (d) => {
          setSystemStatus(d as SystemStatusEvent);
          checkConnection();
        });
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
    // Connect using stored token (if available)
    const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
    // In DEV_MODE, use a placeholder token if none exists
    const devToken = token || (process.env.NODE_ENV === 'development' ? 'dev_mode_token' : null);
    console.log('[WS] Token check:', devToken ? `connecting with token` : 'NO TOKEN - WebSocket will not connect');
    if (devToken) wsClient.connect(devToken);
    else console.log('[WS] Skipping WebSocket connect - no token available');

    // Subscribe to all channels (will be sent once WS is open)
    console.log('[WS] Setting up WebSocket subscriptions...');
    const unsubFlows  = wsClient.subscribe(WS_CHANNELS.FLOWS,  (d) => {
      const flow = d as FlowEvent;
      console.log('[WS] Flow event received:', { flowId: flow.id, src_ip: flow.src_ip, is_anomaly: flow.is_anomaly });
      setLastFlowEvent(flow);
      setFlowEvents((prev) => {
        const updated = [flow, ...prev].slice(0, 1000);
        console.log('[WS] Flow events accumulated:', updated.length);
        return updated;
      });
      setFlowStats((prev) => {
        const next = {
          total_packets: prev.total_packets + 1,
          total_flows: prev.total_flows + 1,
          anomaly_count: prev.anomaly_count + (flow.is_anomaly ? 1 : 0),
        };
        console.log('[WS] Flow stats updated:', next);
        return next;
      });
    });
    const unsubAlerts = wsClient.subscribe(WS_CHANNELS.ALERTS, (d) => {
      const alert = d as AlertEvent;
      console.log('[WS] Alert event received:', { alertId: alert.id, severity: alert.severity, category: alert.category });
      setLastAlertEvent(alert);
      setAlertEvents((prev) => {
        const updated = [alert, ...prev].slice(0, 500);
        console.log('[WS] Alert events accumulated:', updated.length);
        return updated;
      });
    });
    const unsubSystem = wsClient.subscribe(WS_CHANNELS.SYSTEM, (d) => {
      console.log('[WS] System status event received:', d);
      setSystemStatus(d as SystemStatusEvent);
      checkConnection();
    });
    const unsubML     = wsClient.subscribe(WS_CHANNELS.ML,     (d) => {
      console.log('[WS] ML anomaly event received:', d);
      setLastAnomalyEvent(d as AnomalyDetectedEvent);
    });

    // Store unsubscribe functions for dynamic unsubscribe support
    unsubFunctionsRef.current.set(WS_CHANNELS.FLOWS, unsubFlows);
    unsubFunctionsRef.current.set(WS_CHANNELS.ALERTS, unsubAlerts);
    unsubFunctionsRef.current.set(WS_CHANNELS.SYSTEM, unsubSystem);
    unsubFunctionsRef.current.set(WS_CHANNELS.ML, unsubML);

    // Poll connection state every 2 seconds
    const interval = setInterval(checkConnection, 2000);

    // Heartbeat: ping every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (wsClient.isConnected) {
        // Send a ping message (backend should respond with pong)
        // For now, we just check connection state
        checkConnection();
      }
    }, 30000);

    return () => {
      unsubFlows();
      unsubAlerts();
      unsubSystem();
      unsubML();
      unsubFunctionsRef.current.clear();
      clearInterval(interval);
      clearInterval(heartbeatInterval);
    };
  }, [checkConnection]);

  return { isConnected, lastFlowEvent, lastAlertEvent, lastAnomalyEvent, systemStatus, flowEvents, alertEvents, flowStats, subscribe, unsubscribe, reconnect };
}
