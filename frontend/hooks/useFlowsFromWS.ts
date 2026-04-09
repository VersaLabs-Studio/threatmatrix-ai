'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — useFlowsFromWS Hook
// Derives flow statistics from WebSocket events
// ═══════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useWebSocket, type FlowEvent } from '@/hooks/useWebSocket';

export interface TopTalker {
  ip: string;
  bytes_total: number;
  flow_count: number;
  is_anomalous: boolean;
}

export interface ProtocolStats {
  protocol: string;
  count: number;
  percent: number;
}

interface FlowStats {
  total_packets: number;
  total_flows: number;
  anomaly_count: number;
  anomaly_rate: number;
}

interface UseFlowsFromWSReturn {
  stats: FlowStats | null;
  topTalkers: TopTalker[];
  protocols: ProtocolStats[];
  loading: boolean;
}

function aggregateTopTalkers(flows: FlowEvent[]): TopTalker[] {
  const ipMap: Record<string, { bytes: number; flows: number; anomalous: boolean }> = {};
  
  flows.forEach((flow) => {
    if (!ipMap[flow.src_ip]) {
      ipMap[flow.src_ip] = { bytes: 0, flows: 0, anomalous: false };
    }
    ipMap[flow.src_ip].bytes += flow.bytes;
    ipMap[flow.src_ip].flows += 1;
    if (flow.is_anomaly) ipMap[flow.src_ip].anomalous = true;
    
    if (!ipMap[flow.dst_ip]) {
      ipMap[flow.dst_ip] = { bytes: 0, flows: 0, anomalous: false };
    }
    ipMap[flow.dst_ip].bytes += flow.bytes;
    ipMap[flow.dst_ip].flows += 1;
  });
  
  return Object.entries(ipMap)
    .map(([ip, data]) => ({
      ip,
      bytes_total: data.bytes,
      flow_count: data.flows,
      is_anomalous: data.anomalous,
    }))
    .sort((a, b) => b.flow_count - a.flow_count)
    .slice(0, 10);
}

function aggregateProtocols(flows: FlowEvent[]): ProtocolStats[] {
  const protoMap: Record<string, number> = {};
  const total = flows.length;
  
  flows.forEach((flow) => {
    const proto = flow.protocol || 'Unknown';
    protoMap[proto] = (protoMap[proto] || 0) + 1;
  });
  
  return Object.entries(protoMap)
    .map(([protocol, count]) => ({
      protocol,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function useFlowsFromWS(): UseFlowsFromWSReturn {
  const { flowEvents, flowStats } = useWebSocket();
  
  console.log('[useFlowsFromWS] flowEvents:', flowEvents.length, 'flowStats:', flowStats);
  
  const stats = useMemo((): FlowStats | null => {
    if (!flowStats || flowStats.total_flows === 0) return null;
    const computed = {
      ...flowStats,
      anomaly_rate: flowStats.anomaly_count / flowStats.total_flows,
    };
    console.log('[useFlowsFromWS] computed stats:', computed);
    return computed;
  }, [flowStats]);
  
  const topTalkers = useMemo(() => aggregateTopTalkers(flowEvents), [flowEvents]);
  
  const protocols = useMemo(() => aggregateProtocols(flowEvents), [flowEvents]);
  
  const loading = flowEvents.length === 0;
  
  return { stats, topTalkers, protocols, loading };
}