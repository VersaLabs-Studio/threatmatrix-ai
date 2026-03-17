'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useAlerts Hook (MOCKED)
// Simulates API queries and mutations locally.
// ═══════════════════════════════════════════════════════

import { useCallback, useSyncExternalStore } from 'react';
import type { Severity, AlertStatus } from '@/lib/constants';
import { assignAlertToMe, getDemoSimServerState, getDemoSimState, subscribeDemoSim, updateAlertStatus } from '@/lib/demo-sim-store';

export type { Alert } from '@/lib/demo-sim-store';
import type { Alert } from '@/lib/demo-sim-store';

export interface AlertsResponse {
  items: Alert[];
  total: number;
  page: number;
  limit: number;
}

interface AlertFilters {
  severity?: Severity | 'all';
  status?: AlertStatus | 'all';
  page?: number;
  limit?: number;
}

interface UseAlertsReturn {
  alerts: Alert[];
  total: number;
  loading: boolean;
  error: string | null;
  updateStatus: (id: string, status: AlertStatus) => Promise<void>;
  acknowledge: (ids: string[]) => Promise<void>;
  assignToMe: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useAlerts(filters: AlertFilters = {}): UseAlertsReturn {
  const { severity = 'all', status = 'all', page = 1, limit = 50 } = filters;

  const updateStatus = useCallback(async (id: string, newStatus: AlertStatus) => {
    updateAlertStatus(id, newStatus as any);
  }, []);

  const acknowledge = useCallback(async (ids: string[]) => {
    for (const id of ids) updateAlertStatus(id, 'acknowledged');
  }, []);

  const assignToMe = useCallback(async (id: string) => {
    assignAlertToMe(id, 'ANALYST');
  }, []);

  const snap = useSyncExternalStore(subscribeDemoSim, getDemoSimState, getDemoSimServerState);

  let filtered = snap.alerts as Alert[];
  if (severity !== 'all') filtered = filtered.filter((a) => a.severity === severity);
  if (status !== 'all') filtered = filtered.filter((a) => a.status === status);

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  const refetch = useCallback(() => {
    // Store is live; no-op keeps API shape stable.
  }, []);

  return {
    alerts: paginated,
    total: filtered.length,
    loading: false,
    error: null,
    updateStatus,
    acknowledge,
    assignToMe,
    refetch,
  };
}
