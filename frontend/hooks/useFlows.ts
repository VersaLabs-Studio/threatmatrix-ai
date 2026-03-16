'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useFlows Hook
// Fetches network flow data and aggregations
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface NetworkFlow {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  total_packets: number;
  anomaly_score: number;
  is_anomaly: boolean;
  label: string;
  timestamp: string;
  // Geo fields (resolved from IP)
  src_lat?: number;
  src_lon?: number;
  dst_lat?: number;
  dst_lon?: number;
  src_country?: string;
  dst_country?: string;
}

export interface FlowStats {
  timestamp: string;
  packets_per_second: number;
  bytes_per_second: number;
  active_flows: number;
  anomaly_count: number;
}

export interface TopTalker {
  ip: string;
  bytes_total: number;
  flow_count: number;
  country?: string;
  is_anomalous: boolean;
}

export interface ProtocolStats {
  protocol: string;
  count: number;
  percent: number;
}

interface FlowFilters {
  src_ip?: string;
  dst_ip?: string;
  protocol?: string;
  time_range?: '1h' | '6h' | '24h' | '7d';
  min_score?: number;
  label?: string;
  page?: number;
  limit?: number;
}

interface UseFlowsReturn {
  flows: NetworkFlow[];
  stats: FlowStats[];
  topTalkers: TopTalker[];
  protocols: ProtocolStats[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFlows(filters: FlowFilters = {}): UseFlowsReturn {
  const [flows, setFlows]           = useState<NetworkFlow[]>([]);
  const [stats, setStats]           = useState<FlowStats[]>([]);
  const [topTalkers, setTopTalkers] = useState<TopTalker[]>([]);
  const [protocols, setProtocols]   = useState<ProtocolStats[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [flowsRes, statsRes, talkersRes, protocolsRes] = await Promise.allSettled([
      api.get<{ items: NetworkFlow[]; total: number }>('/api/v1/flows', {
        ...filters,
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }),
      api.get<FlowStats[]>('/api/v1/flows/stats', { interval: '1m' }),
      api.get<TopTalker[]>('/api/v1/flows/top-talkers'),
      api.get<ProtocolStats[]>('/api/v1/flows/protocols'),
    ]);

    if (flowsRes.status === 'fulfilled' && flowsRes.value.data) {
      setFlows(flowsRes.value.data.items);
      setTotal(flowsRes.value.data.total);
    }
    if (statsRes.status === 'fulfilled' && statsRes.value.data) {
      setStats(statsRes.value.data);
    }
    if (talkersRes.status === 'fulfilled' && talkersRes.value.data) {
      setTopTalkers(talkersRes.value.data);
    }
    if (protocolsRes.status === 'fulfilled' && protocolsRes.value.data) {
      setProtocols(protocolsRes.value.data);
    }

    // Set error only if ALL requests failed
    const allFailed = [flowsRes, statsRes, talkersRes, protocolsRes]
      .every((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
    setError(allFailed ? 'Failed to load flow data' : null);
    setLoading(false);
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return { flows, stats, topTalkers, protocols, total, loading, error, refetch: fetchAll };
}
