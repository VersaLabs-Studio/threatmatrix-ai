'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useAlerts Hook
// Queries and mutates alert data via REST API
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { alertService } from '@/lib/services';
import type { Severity, AlertStatus } from '@/lib/constants';
import type { AlertResponse } from '@/lib/types';

interface AlertFilters {
  severity?: Severity | 'all';
  status?: AlertStatus | 'all';
  page?: number;
  limit?: number;
}

interface UseAlertsReturn {
  alerts: AlertResponse[];
  total: number;
  loading: boolean;
  error: string | null;
  updateStatus: (id: string, status: AlertStatus) => Promise<void>;
  assignAlert: (id: string, userId: string) => Promise<void>;
  acknowledge: (ids: string[]) => Promise<void>;
  refetch: () => void;
}

export function useAlerts(filters: AlertFilters = {}): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const { severity = 'all', status = 'all', page = 1, limit = 50 } = filters;

  const fetchAlerts = useCallback(async () => {
    const filters: any = { page, limit };
    if (severity !== 'all') filters.severity = severity;
    if (status !== 'all') filters.status = status;

    const { data, error: err } = await alertService.list(filters);
    if (err) {
      setError(err);
    } else if (data) {
      setAlerts(data.items);
      setTotal(data.total);
      setError(null);
    }
    setLoading(false);
  }, [severity, status, page, limit]);

  useEffect(() => {
    // Initial fetch (deferred to avoid synchronous setState in effect)
    const initialTimeout = setTimeout(() => {
      void fetchAlerts();
    }, 0);

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      void fetchAlerts();
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fetchAlerts]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = useCallback(async (id: string, newStatus: AlertStatus) => {
    // Optimistic UI update: update local state immediately
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: newStatus } : alert
      )
    );

    const { error: err } = await alertService.updateStatus(id, newStatus);
    if (err) {
      // Revert on error
      setError(err);
      void fetchAlerts();
    }
  }, [fetchAlerts]);

  const assignAlert = useCallback(async (id: string, userId: string) => {
    const { error: err } = await alertService.assign(id, userId);
    if (err) {
      setError(err);
    } else {
      void fetchAlerts();
    }
  }, [fetchAlerts]);

  const acknowledge = useCallback(async (ids: string[]) => {
    // Optimistic UI update
    setAlerts((prev) =>
      prev.map((alert) =>
        ids.includes(alert.id) ? { ...alert, status: 'acknowledged' as AlertStatus } : alert
      )
    );

    const results = await Promise.allSettled(
      ids.map((id) => alertService.updateStatus(id, 'acknowledged'))
    );

    const hasError = results.some((r) => r.status === 'rejected');
    if (hasError) {
      setError('Some alerts failed to acknowledge');
      void fetchAlerts();
    }
  }, [fetchAlerts]);

  return { alerts, total, loading, error, updateStatus, assignAlert, acknowledge, refetch: fetchAlerts };
}
