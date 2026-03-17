'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useWebSocket Hook (MOCKED)
// Generates live simulated data streams for ThreatMap & Stats
// ═══════════════════════════════════════════════════════

import { useSyncExternalStore } from 'react';
import { getDemoSimServerState, getDemoSimState, subscribeDemoSim } from '@/lib/demo-sim-store';
export type { FlowEvent, AlertEvent, SystemStatusEvent } from '@/lib/demo-sim-store';
import type { FlowEvent, AlertEvent, SystemStatusEvent } from '@/lib/demo-sim-store';

interface UseWebSocketReturn {
  isConnected: boolean;
  lastFlowEvent: FlowEvent | null;
  lastAlertEvent: AlertEvent | null;
  systemStatus: SystemStatusEvent | null;
  recentFlows: FlowEvent[];
}

export function useWebSocket(): UseWebSocketReturn {
  const snap = useSyncExternalStore(subscribeDemoSim, getDemoSimState, getDemoSimServerState);

  return {
    isConnected: snap.isConnected,
    lastFlowEvent: snap.lastFlowEvent,
    lastAlertEvent: snap.lastAlertEvent,
    systemStatus: snap.systemStatus,
    recentFlows: snap.recentFlows,
  };
}
