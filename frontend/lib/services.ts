// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Service Layer
// Wraps API client with typed service methods
// ═══════════════════════════════════════════════════════

import { api } from './api';
import type {
  AlertResponse,
  AlertFilters,
  AlertSeverity,
  FlowResponse,
  FlowFilters,
  TopTalkersResponse,
  ProtocolDistResponse,
  FlowStatsResponse,
  MLModelsResponse,
  MLComparisonResponse,
} from './types';

// Re-export types for convenience
export type { AlertResponse, AlertFilters, FlowResponse, FlowFilters };

// ── Paginated Response Types ───────────────────────────

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Alert Service ──────────────────────────────────────

export const alertService = {
  /** List alerts with optional filters */
  async list(filters?: AlertFilters) {
    const params: Record<string, string | number | undefined> = {};
    if (filters?.severity && filters.severity !== 'all') params.severity = filters.severity;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    return api.get<{ items: AlertResponse[]; total: number }>('/api/v1/alerts/', params);
  },

  /** Get a single alert by ID */
  async get(id: string) {
    return api.get<AlertResponse>(`/api/v1/alerts/${id}`);
  },

  /** Update alert status */
  async updateStatus(id: string, newStatus: string, resolutionNote?: string) {
    return api.patch<AlertResponse>(`/api/v1/alerts/${id}/status`, {
      new_status: newStatus,
      resolution_note: resolutionNote
    });
  },

  /** Assign alert to a user */
  async assign(id: string, userId: string) {
    return api.patch<AlertResponse>(`/api/v1/alerts/${id}/assign`, {
      assignee_id: userId
    });
  },

  /** Update alert severity */
  async updateSeverity(id: string, severity: AlertSeverity) {
    return api.patch<AlertResponse>(`/api/v1/alerts/${id}`, { severity });
  },

  /** Add a note to an alert */
  async addNote(id: string, note: string) {
    return api.post<AlertResponse>(`/api/v1/alerts/${id}/notes`, { note });
  },

  /** Bulk acknowledge alerts */
  async bulkAcknowledge(ids: string[]) {
    return api.post<{ updated: number }>('/api/v1/alerts/bulk/acknowledge', { ids });
  },

  /** Bulk resolve alerts */
  async bulkResolve(ids: string[]) {
    return api.post<{ updated: number }>('/api/v1/alerts/bulk/resolve', { ids });
  },

  /** Mark alert as false positive */
  async markFalsePositive(id: string) {
    return api.patch(`/api/v1/alerts/${id}/status`, { new_status: 'false_positive' });
  },
};

// ── Flow Service ───────────────────────────────────────

export const flowService = {
  /** List network flows with optional filters */
  async list(filters?: FlowFilters) {
    const params: Record<string, string | number | undefined> = {};
    if (filters?.src_ip) params.src_ip = filters.src_ip;
    if (filters?.dst_ip) params.dst_ip = filters.dst_ip;
    if (filters?.protocol) params.protocol = filters.protocol;
    if (filters?.time_range) params.time_range = filters.time_range;
    if (filters?.min_score) params.min_score = filters.min_score;
    if (filters?.label) params.label = filters.label;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    return api.get<PaginatedResponse<FlowResponse>>('/api/v1/flows/', params);
  },

  /** Get a single flow by ID */
  async get(id: string) {
    return api.get<FlowResponse>(`/api/v1/flows/${id}`);
  },

  /** Search flows with POST (query params in URL) */
  async search(query: FlowFilters) {
    const params: Record<string, string | number | undefined> = {};
    if (query.src_ip) params.src_ip = query.src_ip;
    if (query.dst_ip) params.dst_ip = query.dst_ip;
    if (query.protocol) params.protocol = query.protocol;
    if (query.time_range) params.time_range = query.time_range;
    if (query.min_score) params.min_score = query.min_score;
    if (query.label) params.label = query.label;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    // Build URL with query params
    const url = params
      ? `/api/v1/flows/search?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()}`
      : '/api/v1/flows/search';

    // POST with empty body, query params in URL
    return api.post<PaginatedResponse<FlowResponse>>(url, undefined);
  },

  /** Get aggregated flow statistics */
  async getStats(interval: string = '1h') {
    return api.get<FlowStatsResponse>('/api/v1/flows/stats', { interval });
  },

  /** Get top talkers by traffic volume */
  async getTopTalkers(limit: number = 10, timeRange: string = '1h') {
    return api.get<TopTalkersResponse>('/api/v1/flows/top-talkers', {
      limit,
      time_range: timeRange,
    });
  },

  /** Get protocol distribution */
  async getProtocols(timeRange: string = '1h') {
    return api.get<ProtocolDistResponse>('/api/v1/flows/protocols', {
      time_range: timeRange,
    });
  },
};

// ── ML Service (Day 10) ───────────────────────────────

export const mlService = {
  /** Get all ML models with evaluation results */
  async getModels() {
    return api.get<MLModelsResponse>('/api/v1/ml/models');
  },

  /** Get model performance comparison */
  async getComparison() {
    return api.get<MLComparisonResponse>('/api/v1/ml/comparison');
  },

  /** Score a flow with ML models */
  async predict(flowId: string) {
    return api.post<{ prediction: number; scores: Record<string, number> }>(
      '/api/v1/ml/predict',
      { flow_id: flowId }
    );
  },
};
