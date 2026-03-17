'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useWebSocket Hook (MOCKED)
// Generates live simulated data streams for ThreatMap & Stats
// ═══════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import type { ThreatLevel } from '@/lib/constants';
import { MOCK_FLOWS, MOCK_ALERTS } from '@/lib/mock-data';

// ── Typed event shapes ─────────────────────────────────

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

// ── Mock State Trackers ────────────────────────────────

let packets = 12500;
let activeFlowsCount = 1050;

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected]       = useState(false);
  const [lastFlowEvent, setLastFlowEvent]   = useState<FlowEvent | null>(null);
  const [lastAlertEvent, setLastAlertEvent] = useState<AlertEvent | null>(null);
  const [systemStatus, setSystemStatus]     = useState<SystemStatusEvent | null>(null);

  useEffect(() => {
    // 1. Mark as connected instantly
    setIsConnected(true);

    // 2. Initialize system status
    setSystemStatus({
      capture_active: true,
      ml_active: true,
      intel_synced: true,
      llm_online: true,
      threat_level: 'ELEVATED',
      packets_per_second: packets,
      active_flows: activeFlowsCount,
    });

    // 3. Setup data generation intervals
    const flowInterval = setInterval(() => {
      // Pick a random flow to shoot a line on the map
      const randomFlow = MOCK_FLOWS[Math.floor(Math.random() * MOCK_FLOWS.length)];
      setLastFlowEvent({
        id: crypto.randomUUID(),
        src_ip: randomFlow.src_ip,
        dst_ip: randomFlow.dst_ip,
        src_lat: randomFlow.src_lat,
        src_lon: randomFlow.src_lon,
        dst_lat: randomFlow.dst_lat,
        dst_lon: randomFlow.dst_lon,
        protocol: randomFlow.protocol,
        bytes: randomFlow.src_bytes + randomFlow.dst_bytes,
        anomaly_score: randomFlow.anomaly_score,
        is_anomaly: randomFlow.is_anomaly,
        label: randomFlow.label,
        timestamp: new Date().toISOString()
      });

      // Fluctuate system status slightly
      packets += Math.floor(Math.random() * 2000) - 1000;
      activeFlowsCount += Math.floor(Math.random() * 50) - 25;
      
      setSystemStatus(prev => prev ? {
        ...prev,
        packets_per_second: Math.max(0, packets),
        active_flows: Math.max(0, activeFlowsCount)
      } : null);

    }, 800); // New flow event every 800ms

    const alertInterval = setInterval(() => {
      // Occasional new alert notification
      if (Math.random() > 0.7) {
        const randomAlert = MOCK_ALERTS[Math.floor(Math.random() * MOCK_ALERTS.length)];
        setLastAlertEvent({
          id: crypto.randomUUID(),
          severity: randomAlert.severity,
          category: randomAlert.category,
          src_ip: randomAlert.src_ip,
          dst_ip: randomAlert.dst_ip,
          composite_score: randomAlert.composite_score,
          timestamp: new Date().toISOString(),
          status: 'open'
        });
      }
    }, 5000); // Check every 5s

    return () => {
      clearInterval(flowInterval);
      clearInterval(alertInterval);
      setIsConnected(false);
    };
  }, []);

  return { isConnected, lastFlowEvent, lastAlertEvent, systemStatus };
}
