'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useAlertsFromWS Hook
// Derives alert data from WebSocket events
// ═══════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useWebSocket, type AlertEvent } from '@/hooks/useWebSocket';
import type { Severity, AlertStatus } from '@/lib/constants';

export interface AlertResponse {
  id: string;
  alert_id: string;
  severity: Severity;
  category: string;
  source_ip: string;
  dest_ip: string;
  confidence: number;
  title: string;
  description?: string;
  status: AlertStatus;
  created_at: string;
  ai_narrative?: string;
  ml_model?: string;
  if_score?: number;
  ae_score?: number;
  rf_score?: number;
}

interface UseAlertsFromWSReturn {
  alerts: AlertResponse[];
  total: number;
  loading: boolean;
  error: string | null;
}

function alertEventToResponse(event: AlertEvent): AlertResponse {
  return {
    id: event.id,
    alert_id: event.id,
    severity: event.severity,
    category: event.category,
    source_ip: event.src_ip,
    dest_ip: event.dst_ip,
    confidence: event.composite_score,
    title: `${event.severity.toUpperCase()} — ${event.category} detected`,
    description: `ML ensemble detected ${event.category} activity. Composite score: ${event.composite_score.toFixed(2)}.`,
    status: event.status || 'open',
    created_at: event.timestamp,
  };
}

export function useAlertsFromWS(): UseAlertsFromWSReturn {
  const { alertEvents } = useWebSocket();
  
  console.log('[useAlertsFromWS] alertEvents:', alertEvents.length);
  
  const alerts = useMemo(() => {
    const transformed = alertEvents.map(alertEventToResponse);
    console.log('[useAlertsFromWS] transformed alerts:', transformed.length);
    return transformed;
  }, [alertEvents]);
  
  const total = alerts.length;
  const loading = alertEvents.length === 0;
  const error = null;
  
  return { alerts, total, loading, error };
}