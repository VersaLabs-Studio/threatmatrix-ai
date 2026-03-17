'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useAlerts Hook (MOCKED)
// Simulates API queries and mutations locally.
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import type { Severity, AlertStatus } from '@/lib/constants';
import { MOCK_ALERTS } from '@/lib/mock-data';

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

// Global mutable state for the session to persist status changes across unmounts
let sessionAlerts = [...MOCK_ALERTS];

export function useAlerts(filters: AlertFilters = {}): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error]   = useState<string | null>(null);

  const { severity = 'all', status = 'all', page = 1, limit = 50 } = filters;

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      let filtered = sessionAlerts;
      
      if (severity !== 'all') {
        filtered = filtered.filter(a => a.severity === severity);
      }
      if (status !== 'all') {
        filtered = filtered.filter(a => a.status === status);
      }

      // Pagination slice
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      setAlerts(paginated);
      setTotal(filtered.length);
      setLoading(false);
    }, 400); // 400ms fake latency
  }, [severity, status, page, limit]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateStatus = useCallback(async (id: string, newStatus: AlertStatus) => {
    sessionAlerts = sessionAlerts.map(a => a.id === id ? { ...a, status: newStatus } : a);
    fetchAlerts(); // Re-run local filters and update state
  }, [fetchAlerts]);

  const acknowledge = useCallback(async (ids: string[]) => {
    sessionAlerts = sessionAlerts.map(a => ids.includes(a.id) ? { ...a, status: 'acknowledged' } : a);
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, total, loading, error, updateStatus, acknowledge, refetch: fetchAlerts };
}
