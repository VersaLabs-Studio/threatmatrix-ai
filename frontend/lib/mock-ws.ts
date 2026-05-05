// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Mock WebSocket Simulator
// Emits realistic events on timers for demo mode
// ═══════════════════════════════════════════════════════

import { WS_CHANNELS } from './constants';

type Listener = (data: unknown) => void;
type WSChannel = (typeof WS_CHANNELS)[keyof typeof WS_CHANNELS];

// Ethiopian + international geo coordinates
const ATTACK_SOURCES = [
  { lat: 39.9, lon: 116.4, ip: '103.45.67.89', country: 'China' },
  { lat: 51.5, lon: -0.12, ip: '185.220.101.34', country: 'UK' },
  { lat: 48.8, lon: 2.35, ip: '91.134.200.55', country: 'France' },
  { lat: 40.7, lon: -74.0, ip: '8.8.8.8', country: 'USA' },
  { lat: 52.5, lon: 13.4, ip: '187.124.45.161', country: 'Germany' },
  { lat: 44.4, lon: 26.1, ip: '89.40.182.15', country: 'Romania' },
  { lat: 50.4, lon: 30.5, ip: '78.128.113.42', country: 'Ukraine' },
  { lat: 46.2, lon: 6.1, ip: '185.100.87.41', country: 'Switzerland' },
];

const INTERNAL_IPS = [
  { lat: 9.02, lon: 38.75, ip: '10.0.1.5' },
  { lat: 9.03, lon: 38.76, ip: '10.0.1.47' },
  { lat: 9.01, lon: 38.74, ip: '10.0.1.15' },
  { lat: 9.04, lon: 38.77, ip: '10.0.1.52' },
  { lat: 9.02, lon: 38.73, ip: '10.0.1.72' },
  { lat: 9.03, lon: 38.75, ip: '196.188.1.10' },
];

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const CATEGORIES = ['ddos', 'port_scan', 'dns_tunnel', 'brute_force', 'c2', 'data_exfiltration'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

class MockWebSocketClient {
  private listeners: Map<WSChannel, Set<Listener>> = new Map();
  private timers: ReturnType<typeof setInterval>[] = [];
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  connect(_token: string) {
    this._isConnected = true;
    console.log('[MockWS] Connected (demo mode)');

    // Emit system status immediately
    this._emitSystemStatus();

    // Flow events every 3-5 seconds
    this.timers.push(setInterval(() => this._emitFlowEvent(), 3000 + Math.random() * 2000));

    // Alert events every 15-30 seconds
    this.timers.push(setInterval(() => this._emitAlertEvent(), 15000 + Math.random() * 15000));

    // Anomaly events every 10-20 seconds
    this.timers.push(setInterval(() => this._emitAnomalyEvent(), 10000 + Math.random() * 10000));

    // System status every 5 seconds
    this.timers.push(setInterval(() => this._emitSystemStatus(), 5000));

    // ML metrics every 5 seconds
    this.timers.push(setInterval(() => this._emitMLMetrics(), 5000));
  }

  disconnect() {
    this._isConnected = false;
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
    console.log('[MockWS] Disconnected');
  }

  subscribe(channel: WSChannel, listener: Listener) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);
    return () => {
      this.listeners.get(channel)?.delete(listener);
    };
  }

  ping() {
    // No-op in mock mode
  }

  private _dispatch(channel: WSChannel, data: unknown) {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach(fn => fn(data));
    }
  }

  private _emitFlowEvent() {
    const isAttack = Math.random() < 0.3;
    const src = isAttack ? pick(ATTACK_SOURCES) : pick(INTERNAL_IPS);
    const dst = isAttack ? pick(INTERNAL_IPS) : { lat: 37.4, lon: -122.1, ip: '142.250.185.46' };

    this._dispatch(WS_CHANNELS.FLOWS, {
      id: `flow-${randomId()}`,
      src_ip: src.ip,
      dst_ip: dst.ip,
      src_lat: src.lat,
      src_lon: src.lon,
      dst_lat: dst.lat,
      dst_lon: dst.lon,
      protocol: Math.random() > 0.7 ? 'UDP' : 'TCP',
      bytes: Math.round(Math.random() * 50000),
      anomaly_score: isAttack ? 0.6 + Math.random() * 0.35 : Math.random() * 0.2,
      is_anomaly: isAttack,
      label: isAttack ? pick(CATEGORIES) : 'normal',
      timestamp: new Date().toISOString(),
    });
  }

  private _emitAlertEvent() {
    const severity = Math.random() < 0.2 ? 'critical' : Math.random() < 0.4 ? 'high' : 'medium';
    const category = pick(CATEGORIES);
    const src = pick(ATTACK_SOURCES);
    const dst = pick(INTERNAL_IPS);

    this._dispatch(WS_CHANNELS.ALERTS, {
      id: `alert-${randomId()}`,
      severity,
      category,
      src_ip: src.ip,
      dst_ip: dst.ip,
      composite_score: severity === 'critical' ? 0.90 + Math.random() * 0.1 : severity === 'high' ? 0.75 + Math.random() * 0.15 : 0.50 + Math.random() * 0.25,
      timestamp: new Date().toISOString(),
      status: 'open',
    });
  }

  private _emitAnomalyEvent() {
    const src = pick(ATTACK_SOURCES);
    const dst = pick(INTERNAL_IPS);
    const score = 0.5 + Math.random() * 0.45;

    this._dispatch(WS_CHANNELS.ML, {
      flow_id: `flow-${randomId()}`,
      src_ip: src.ip,
      dst_ip: dst.ip,
      anomaly_score: score,
      composite_score: score,
      severity: score >= 0.9 ? 'critical' : score >= 0.75 ? 'high' : 'medium',
      category: pick(CATEGORIES),
      label: pick(CATEGORIES),
      if_score: 0.4 + Math.random() * 0.5,
      ae_score: 0.5 + Math.random() * 0.5,
      rf_confidence: 0.5 + Math.random() * 0.4,
      model_agreement: Math.random() > 0.5 ? 'majority' : 'unanimous',
      timestamp: new Date().toISOString(),
    });
  }

  private _emitSystemStatus() {
    this._dispatch(WS_CHANNELS.SYSTEM, {
      capture_active: true,
      ml_active: true,
      intel_synced: true,
      llm_online: true,
      threat_level: 'ELEVATED',
      packets_per_second: Math.round(25 + Math.random() * 15),
      active_flows: Math.round(300 + Math.random() * 200),
    });
  }

  private _emitMLMetrics() {
    const ifMs = 30 + Math.random() * 30;
    const rfMs = 8 + Math.random() * 10;
    const aeMs = 60 + Math.random() * 40;

    this._dispatch(WS_CHANNELS.METRICS, {
      data: {
        payload: {
          flow_id: `flow-${randomId()}`,
          preprocess_ms: 1 + Math.random() * 2,
          if_ms: ifMs,
          rf_ms: rfMs,
          ae_ms: aeMs,
          ensemble_ms: 0.3 + Math.random() * 0.5,
          total_ms: ifMs + rfMs + aeMs + 2,
          severity: Math.random() > 0.8 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
}

// Singleton — replaces real wsClient in demo mode
export const mockWsClient = new MockWebSocketClient();
