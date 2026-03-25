// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Type Definitions
// ═══════════════════════════════════════════════════════

import type { Severity, AlertStatus } from './constants';

// ── Alert Types ────────────────────────────────────────

export type AlertSeverity = Severity;

export interface AlertResponse {
  id: string;
  alert_id: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  category?: string;
  source_ip?: string;
  dest_ip?: string;
  destination_ip?: string;
  confidence?: number;
  status: AlertStatus;
  assigned_to?: string;
  flow_ids?: string[];
  ml_model?: string;
  ai_narrative?: string;
  ai_playbook?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
  created_at: string;
  updated_at?: string;
  // ML-specific fields
  composite_score?: number;
  model_agreement?: 'unanimous' | 'majority' | 'single' | 'none';
  rf_label?: string;
  rf_confidence?: number;
  if_score?: number;
  ae_score?: number;
  label?: string;
  flow_count?: number;
  timestamp?: string;
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
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: number;
  duration: number | null;
  total_bytes: number | null;
  total_packets: number | null;
  src_bytes: number | null;
  dst_bytes: number | null;
  features: Record<string, unknown>;
  anomaly_score: number | null;
  is_anomaly: boolean;
  ml_model: string | null;
  label: string | null;
  source: string;
  created_at: string;
}

export interface NetworkFlow {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string; // Transformed to human-readable name (TCP, UDP, ICMP)
  duration: number | null;
  total_bytes: number | null;
  total_packets: number | null;
  src_bytes: number | null;
  dst_bytes: number | null;
  features: Record<string, unknown>;
  anomaly_score: number | null;
  is_anomaly: boolean;
  ml_model: string | null;
  label: string | null;
  source: string;
  created_at: string;
  timestamp: string; // Alias for the flow timestamp
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
    flow_count: number;
    total_bytes: number;
    total_packets: number;
    anomaly_count: number;
  }>;
  period: string;
  total_talkers: number;
}

export interface ProtocolDistResponse {
  protocols: Record<string, {
    count: number;
    percentage: number;
  }>;
  total_flows: number;
  period: string;
}

export interface FlowStatsResponse {
  interval: string;
  total_flows: number;
  anomaly_count: number;
  anomaly_percentage: number;
  protocol_distribution: Record<string, { count: number; percentage: number }>;
  top_source_ips: Array<Record<string, unknown>>;
  top_dest_ips: Array<Record<string, unknown>>;
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

// ── ML API Response Types (Day 10) ─────────────────────

export interface MLModelEvalResults {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  confusion_matrix: number[][];
}

export interface MLModelDetail {
  name: string;
  trained: boolean;
  eval_results: MLModelEvalResults;
}

export interface MLModelsResponse {
  models: MLModelDetail[];
}

export interface MLComparisonModel {
  model: string;
  accuracy: number;
  f1_score: number;
  auc_roc: number;
}

export interface MLComparisonResponse {
  models: MLComparisonModel[];
  best_accuracy: string;
  best_f1: string;
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
