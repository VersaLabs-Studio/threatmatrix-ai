'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useFlows Hook (MOCKED)
// Locally returns simulated network flows and aggregations
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { MOCK_FLOWS, MOCK_STATS_TIMELINE, MOCK_TOP_TALKERS, MOCK_PROTOCOLS } from '@/lib/mock-data';

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
  const [error]           = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      setFlows(MOCK_FLOWS);
      setTotal(MOCK_FLOWS.length);
      setStats(MOCK_STATS_TIMELINE);
      setTopTalkers(MOCK_TOP_TALKERS);
      setProtocols(MOCK_PROTOCOLS);
      
      setLoading(false);
    }, 600); // 600ms fake latency

  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { flows, stats, topTalkers, protocols, total, loading, error, refetch: fetchAll };
}
