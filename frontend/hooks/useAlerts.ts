'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useAlerts Hook
// Queries and mutates alert data via REST API
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Severity, AlertStatus } from '@/lib/constants';

export interface Alert {
  id: string;
  severity: Severity;
  category: string;
  src_ip: string;
  dst_ip: string;
  src_port?: number;
  dst_port?: number;
  composite_score: number;
  label: string;
  status: AlertStatus;
  assigned_to?: string;
  ai_narrative?: string;
  flow_count: number;
  timestamp: string;
  updated_at: string;
}

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
  refetch: () => void;
}

export function useAlerts(filters: AlertFilters = {}): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const { severity = 'all', status = 'all', page = 1, limit = 50 } = filters;

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number | undefined> = { page, limit };
    if (severity !== 'all') params.severity = severity;
    if (status   !== 'all') params.status   = status;

    const { data, error: err } = await api.get<AlertsResponse>('/api/v1/alerts', params);
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
    void fetchAlerts();
  }, [fetchAlerts]);

  const updateStatus = useCallback(async (id: string, newStatus: AlertStatus) => {
    await api.patch(`/api/v1/alerts/${id}/status`, { status: newStatus });
    void fetchAlerts();
  }, [fetchAlerts]);

  const acknowledge = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map((id) => api.patch(`/api/v1/alerts/${id}/status`, { status: 'acknowledged' })));
    void fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, total, loading, error, updateStatus, acknowledge, refetch: fetchAlerts };
}
