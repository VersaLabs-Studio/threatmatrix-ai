'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useFlows Hook (MOCKED)
// Locally returns simulated network flows and aggregations
// ═══════════════════════════════════════════════════════

import { useCallback, useSyncExternalStore } from 'react';
import { getDemoSimServerState, getDemoSimState, subscribeDemoSim } from '@/lib/demo-sim-store';
export type { NetworkFlow, FlowStats, TopTalker, ProtocolStats } from '@/lib/demo-sim-store';
import type { NetworkFlow, FlowStats, TopTalker, ProtocolStats } from '@/lib/demo-sim-store';

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
  const snap = useSyncExternalStore(subscribeDemoSim, getDemoSimState, getDemoSimServerState);

  const refetch = useCallback(() => {
    // Store is live; no-op refetch keeps API shape stable.
  }, []);

  const { src_ip, dst_ip, protocol, min_score, label, page = 1, limit = 200 } = filters;

  let flows = snap.flows;

  if (src_ip) flows = flows.filter((f) => f.src_ip.includes(src_ip));
  if (dst_ip) flows = flows.filter((f) => f.dst_ip.includes(dst_ip));
  if (protocol) flows = flows.filter((f) => f.protocol === protocol);
  if (min_score !== undefined) flows = flows.filter((f) => f.anomaly_score >= min_score);
  if (label) flows = flows.filter((f) => f.label.toLowerCase().includes(label.toLowerCase()));

  const total = flows.length;
  const start = (page - 1) * limit;
  flows = flows.slice(start, start + limit);

  return {
    flows,
    stats: snap.stats,
    topTalkers: snap.topTalkers,
    protocols: snap.protocols,
    total,
    loading: false,
    error: null,
    refetch,
  };
}
