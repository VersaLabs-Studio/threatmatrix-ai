// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Type Definitions
// ═══════════════════════════════════════════════════════

import type { Severity, AlertStatus } from './constants';

// ── Alert Types ────────────────────────────────────────

export type AlertSeverity = Severity;

export interface AlertResponse {
  id: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category?: string;
  confidence?: number;
  source_ip?: string;
  dest_ip?: string;
  flow_ids?: string[];
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
}

export interface AlertFilters {
  severity?: AlertSeverity | 'all';
  status?: AlertStatus | 'all';
  page?: number;
  limit?: number;
}

// ── Flow Types ─────────────────────────────────────────

export interface FlowResponse {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: number;
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  flags?: string;
  label?: string;
  score?: number;
}

export interface NetworkFlow extends Omit<FlowResponse, 'protocol'> {
  protocol: string; // Transformed to human-readable name
  timestamp: string; // Alias for start_time used in UI
  total_bytes: number; // Computed: bytes_sent + bytes_received
  anomaly_score: number; // Alias for score
  src_bytes: number; // Alias for bytes_sent
  dst_bytes: number; // Alias for bytes_received
  is_anomaly: boolean; // Computed: score > threshold
}

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

export interface FlowStats {
  total_flows: number;
  total_bytes: number;
  avg_duration_ms: number;
  anomaly_count: number;
}

export interface FlowTimeline {
  timestamp: string;
  packets_per_second: number;
  active_flows: number;
  anomaly_count: number;
}

export interface TopTalkersResponse {
  top_talkers: Array<{
    ip: string;
    total_bytes: number;
    flow_count: number;
    anomaly_count: number;
  }>;
}

export interface ProtocolDistResponse {
  protocols: Record<string, {
    count: number;
    percentage: number;
  }>;
}

export interface FlowStatsResponse {
  total_flows: number;
  total_bytes: number;
  avg_duration_ms: number;
  anomaly_count: number;
  time_range: string;
}

export interface FlowFilters {
  src_ip?: string;
  dst_ip?: string;
  protocol?: number;
  time_range?: '1h' | '6h' | '24h' | '7d';
  min_score?: number;
  label?: string;
  page?: number;
  limit?: number;
}

// ── PCAP / Forensics Types ─────────────────────────────

export type PCAPStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PCAPUploadResponse {
  id: string;
  filename: string;
  file_size?: number;
  status: PCAPStatus;
  packets_count?: number;
  flows_extracted?: number;
  anomalies_found?: number;
  created_at: string;
  updated_at?: string;
  error_message?: string;
}

// ── Intel / IOC Types ──────────────────────────────────

export interface IOCResponse {
  id: string;
  ioc_type: string;
  ioc_value: string;
  source: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence?: number;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

// ── ML Model Types ─────────────────────────────────────

export type MLModelStatus = 'active' | 'training' | 'retired' | 'failed';

export interface MLModelMetrics {
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  auc?: number;
}

export interface MLModelResponse {
  id: string;
  name: string;
  model_type: string;
  version: string;
  status: MLModelStatus;
  metrics?: MLModelMetrics;
  inference_time?: number;
  created_at: string;
  updated_at?: string;
  trained_at?: string;
}

// ── System Health Types ────────────────────────────────

export type SystemStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface SystemHealth {
  status: SystemStatus;
  version: string;
  uptime: number;
  services: Record<string, {
    status: SystemStatus;
    latency_ms?: number;
    last_check: string;
  }>;
  metrics?: {
    cpu_percent?: number;
    memory_percent?: number;
    disk_percent?: number;
    active_connections?: number;
  };
  timestamp: string;
}
