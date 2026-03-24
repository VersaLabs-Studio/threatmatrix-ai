'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useFlows Hook
// Fetches network flow data and aggregations
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { flowService } from '@/lib/services';
import { mapProtocolNumber } from '@/lib/utils';
import type {
  NetworkFlow,
  TopTalker,
  ProtocolStats,
  FlowResponse,
  TopTalkersResponse,
  ProtocolDistResponse,
  FlowStatsResponse,
} from '@/lib/types';

// Export types for component usage
export type { NetworkFlow, TopTalker, ProtocolStats, FlowResponse, TopTalkersResponse, ProtocolDistResponse, FlowStatsResponse };

interface FlowFilters {
  src_ip?: string;
  dst_ip?: string;
  protocol?: number;
  time_range?: '1h' | '6h' | '24h' | '7d';
  min_score?: number;
  label?: string;
  page?: number;
  limit?: number;
}

interface UseFlowsReturn {
  flows: NetworkFlow[];
  stats: FlowStatsResponse | null;  // Aggregated stats (single object)
  topTalkers: TopTalker[];
  protocols: ProtocolStats[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  searchFlows: (query: FlowFilters) => Promise<NetworkFlow[]>;
}

// Transform backend FlowResponse to frontend NetworkFlow
const transformFlow = (flow: FlowResponse): NetworkFlow => ({
  ...flow,
  protocol: mapProtocolNumber(flow.protocol),
  timestamp: flow.timestamp,
});

// Transform backend TopTalkersResponse to frontend TopTalker[]
const transformTopTalkers = (res: TopTalkersResponse): TopTalker[] =>
  res.top_talkers.map(t => ({
    ip: t.ip,
    bytes_total: t.total_bytes,
    flow_count: t.flow_count,
    is_anomalous: t.anomaly_count > 0,
  }));

// Transform backend ProtocolDistResponse to frontend ProtocolStats[]
const transformProtocols = (res: ProtocolDistResponse): ProtocolStats[] =>
  Object.entries(res.protocols).map(([protocol, data]) => ({
    protocol,
    count: data.count,
    percent: data.percentage,
  }));

export function useFlows(filters: FlowFilters = {}): UseFlowsReturn {
  const [flows, setFlows]           = useState<NetworkFlow[]>([]);
  const [stats, setStats]           = useState<FlowStatsResponse | null>(null);
  const [topTalkers, setTopTalkers] = useState<TopTalker[]>([]);
  const [protocols, setProtocols]   = useState<ProtocolStats[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetchAll = useCallback(async () => {
    // Only show skeleton on initial fetch, not on poll refreshes
    if (!initialLoadDone.current) setLoading(true);

    const [flowsRes, statsRes, talkersRes, protocolsRes] = await Promise.allSettled([
      flowService.list(filters),
      flowService.getStats('1h'),
      flowService.getTopTalkers(10, '1h'),
      flowService.getProtocols('1h'),
    ]);

    if (flowsRes.status === 'fulfilled' && flowsRes.value.data) {
      const transformed = flowsRes.value.data.items.map(transformFlow);
      setFlows(transformed);
      setTotal(flowsRes.value.data.total);
    }
    if (statsRes.status === 'fulfilled' && statsRes.value.data) {
      setStats(statsRes.value.data as FlowStatsResponse);
    }
    if (talkersRes.status === 'fulfilled' && talkersRes.value.data) {
      setTopTalkers(transformTopTalkers(talkersRes.value.data));
    }
    if (protocolsRes.status === 'fulfilled' && protocolsRes.value.data) {
      setProtocols(transformProtocols(protocolsRes.value.data));
    }

    // Set error only if ALL requests failed
    const allFailed = [flowsRes, statsRes, talkersRes, protocolsRes]
      .every((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
    setError(allFailed ? 'Failed to load flow data' : null);
    setLoading(false);
    initialLoadDone.current = true;
  }, [JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchFlows = useCallback(async (query: FlowFilters): Promise<NetworkFlow[]> => {
    const { data, error: err } = await flowService.search(query);
    if (err) {
      console.error('[useFlows] Search error:', err);
      return [];
    }
    const transformed = data?.items?.map(transformFlow) ?? [];
    return transformed;
  }, []);

  useEffect(() => {
    // Initial fetch (deferred to avoid synchronous setState in effect)
    const initialTimeout = setTimeout(() => {
      void fetchAll();
    }, 0);

    // Auto-refresh every 3 seconds (per MASTER_DOC_PART3 §2.3)
    const interval = setInterval(() => {
      void fetchAll();
    }, 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fetchAll]); // eslint-disable-line react-hooks/exhaustive-deps

  return { flows, stats, topTalkers, protocols, total, loading, error, refetch: fetchAll, searchFlows };
}
