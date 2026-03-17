'use client';

import { demoEmitter } from '@/lib/demo-emitter';
import { MOCK_ALERTS, MOCK_FLOWS, MOCK_PROTOCOLS, MOCK_STATS_TIMELINE, MOCK_TOP_TALKERS } from '@/lib/mock-data';
import type { ThreatLevel } from '@/lib/constants';

export interface FlowEvent {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_lat?: number;
  src_lon?: number;
  dst_lat?: number;
  dst_lon?: number;
  protocol: string;
  bytes: number;
  anomaly_score: number;
  is_anomaly: boolean;
  label: string;
  timestamp: string;
}

export interface AlertEvent {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  src_ip: string;
  dst_ip: string;
  composite_score: number;
  timestamp: string;
  status: string;
}

export interface SystemStatusEvent {
  capture_active: boolean;
  ml_active: boolean;
  intel_synced: boolean;
  llm_online: boolean;
  threat_level: ThreatLevel;
  packets_per_second: number;
  active_flows: number;
}

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

export interface Alert {
  id: string;
  severity: AlertEvent['severity'];
  category: string;
  src_ip: string;
  dst_ip: string;
  src_port?: number;
  dst_port?: number;
  composite_score: number;
  label: string;
  status: 'open' | 'acknowledged' | 'resolved';
  assigned_to?: string;
  ai_narrative?: string;
  flow_count: number;
  timestamp: string;
  updated_at: string;
}

export interface DemoSimState {
  isConnected: boolean;
  chaosIntensity: number; // 0..1
  systemStatus: SystemStatusEvent;
  lastFlowEvent: FlowEvent | null;
  lastAlertEvent: AlertEvent | null;
  recentFlows: FlowEvent[];
  flows: NetworkFlow[];
  stats: FlowStats[];
  topTalkers: TopTalker[];
  protocols: ProtocolStats[];
  alerts: Alert[];
}

type Listener = () => void;

const MAX_RECENT_FLOW_EVENTS = 180;
const MAX_FLOW_ROWS = 250;
const MAX_ALERTS = 400;
const STATS_POINTS = 60;

// Addis Ababa, Ethiopia (demo "convergence" target)
const ADDIS_ABABA = {
  lat: 9.025,
  lon: 38.747,
  ip: '10.0.1.5',
};

let subscribers = 0;
let listeners = new Set<Listener>();

let generatorInterval: number | null = null;
let alertInterval: number | null = null;
let unsubTrigger: (() => void) | null = null;
let unsubResolve: (() => void) | null = null;

let chaosTarget = 0; // 0 or 1
let chaosIntensity = 0; // eased towards chaosTarget
let packets = 12500;
let activeFlowsCount = 1050;
let lastResolveAt = 0;

let state: DemoSimState = seedInitialState();
const serverState: DemoSimState = seedInitialState('server');

function seedInitialState(mode: 'client' | 'server' = 'client'): DemoSimState {
  // Must be deterministic across SSR + hydration to avoid mismatches.
  const now = mode === 'server' ? '2026-03-17T00:00:00.000Z' : new Date().toISOString();
  return {
    isConnected: true,
    chaosIntensity: 0,
    systemStatus: {
      capture_active: true,
      ml_active: true,
      intel_synced: true,
      llm_online: true,
      threat_level: 'ELEVATED',
      packets_per_second: packets,
      active_flows: activeFlowsCount,
    },
    lastFlowEvent: null,
    lastAlertEvent: null,
    recentFlows: [],
    flows: MOCK_FLOWS.slice(0, Math.min(MOCK_FLOWS.length, 120)).map((f) => ({
      id: f.id,
      src_ip: f.src_ip,
      dst_ip: f.dst_ip,
      src_port: f.src_port,
      dst_port: f.dst_port,
      protocol: f.protocol,
      duration: f.duration,
      src_bytes: f.src_bytes,
      dst_bytes: f.dst_bytes,
      total_packets: f.total_packets,
      anomaly_score: f.anomaly_score,
      is_anomaly: f.is_anomaly,
      label: f.label,
      timestamp: f.timestamp ?? now,
      src_lat: f.src_lat,
      src_lon: f.src_lon,
      dst_lat: f.dst_lat,
      dst_lon: f.dst_lon,
      src_country: (f as any).src_country,
      dst_country: (f as any).dst_country,
    })),
    stats: MOCK_STATS_TIMELINE.slice(-STATS_POINTS),
    topTalkers: MOCK_TOP_TALKERS,
    protocols: MOCK_PROTOCOLS,
    alerts: [...(MOCK_ALERTS as any as Alert[])].slice(0, 120),
  };
}

function emitChange() {
  for (const l of listeners) l();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeThreatLevel(intensity: number): ThreatLevel {
  if (intensity > 0.75) return 'CRITICAL';
  if (intensity > 0.35) return 'HIGH';
  return 'ELEVATED';
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nextFlowEvent(intensity: number): FlowEvent {
  const base = pick(MOCK_FLOWS);
  const chaos = intensity > 0.6;
  // While an incident is active, force convergence immediately (no ramp delay).
  const converge = chaosTarget === 1 || intensity > 0.2;
  const anomalyScore = chaos ? clamp(0.88 + Math.random() * 0.11, 0, 0.99) : base.anomaly_score;
  const isAnom = chaos ? true : base.is_anomaly;
  const bytes = (base.src_bytes + base.dst_bytes) * lerp(1, 10, intensity);

  return {
    id: crypto.randomUUID(),
    src_ip: base.src_ip,
    dst_ip: converge ? ADDIS_ABABA.ip : base.dst_ip,
    src_lat: base.src_lat,
    src_lon: base.src_lon,
    dst_lat: converge ? ADDIS_ABABA.lat : base.dst_lat,
    dst_lon: converge ? ADDIS_ABABA.lon : base.dst_lon,
    protocol: base.protocol,
    bytes: Math.round(bytes),
    anomaly_score: anomalyScore,
    is_anomaly: isAnom,
    label: chaos ? 'DDoS ATTACK' : base.label,
    timestamp: new Date().toISOString(),
  };
}

function flowEventToNetworkFlow(e: FlowEvent): NetworkFlow {
  const srcBytes = Math.round(e.bytes * (0.65 + Math.random() * 0.25));
  const dstBytes = Math.max(0, e.bytes - srcBytes);

  const proto = e.protocol || 'TCP';
  const dstPort = proto === 'UDP' ? 53 : 443;
  const srcPort = 32000 + Math.floor(Math.random() * 20000);

  return {
    id: e.id,
    src_ip: e.src_ip,
    dst_ip: e.dst_ip,
    src_port: srcPort,
    dst_port: dstPort,
    protocol: proto,
    duration: Math.round((0.2 + Math.random() * 60) * 10) / 10,
    src_bytes: srcBytes,
    dst_bytes: dstBytes,
    total_packets: Math.max(1, Math.round(e.bytes / (800 + Math.random() * 600))),
    anomaly_score: e.anomaly_score,
    is_anomaly: e.is_anomaly,
    label: e.label,
    timestamp: e.timestamp,
    src_lat: e.src_lat,
    src_lon: e.src_lon,
    dst_lat: e.dst_lat,
    dst_lon: e.dst_lon,
  };
}

function recomputeAggregates(flows: NetworkFlow[]) {
  // Protocols
  const protoCounts = new Map<string, number>();
  for (const f of flows) protoCounts.set(f.protocol, (protoCounts.get(f.protocol) ?? 0) + 1);
  const total = flows.length || 1;
  const protocols: ProtocolStats[] = Array.from(protoCounts.entries())
    .map(([protocol, count]) => ({ protocol, count, percent: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Top talkers (by bytes)
  const talker = new Map<string, { bytes: number; flows: number; anomalous: boolean }>();
  for (const f of flows) {
    const key = f.src_ip;
    const prev = talker.get(key) ?? { bytes: 0, flows: 0, anomalous: false };
    talker.set(key, {
      bytes: prev.bytes + f.src_bytes + f.dst_bytes,
      flows: prev.flows + 1,
      anomalous: prev.anomalous || f.is_anomaly,
    });
  }
  const topTalkers: TopTalker[] = Array.from(talker.entries())
    .map(([ip, v]) => ({ ip, bytes_total: v.bytes, flow_count: v.flows, is_anomalous: v.anomalous }))
    .sort((a, b) => b.bytes_total - a.bytes_total)
    .slice(0, 10);

  return { protocols, topTalkers };
}

function pushStatPoint(nowIso: string, intensity: number, flows: NetworkFlow[]): FlowStats {
  const anomalyCount = flows.slice(0, 60).reduce((s, f) => s + (f.is_anomaly ? 1 : 0), 0);
  const bytesPerSecond = Math.round(packets * (700 + 500 * intensity)); // purely illustrative
  return {
    timestamp: nowIso,
    packets_per_second: Math.round(packets),
    bytes_per_second: bytesPerSecond,
    active_flows: Math.round(activeFlowsCount),
    anomaly_count: anomalyCount,
  };
}

function addSimulatedAlert(intensity: number, basedOn?: FlowEvent): AlertEvent {
  const base = pick(MOCK_ALERTS);
  const chaos = intensity > 0.6;
  const src = basedOn?.src_ip ?? base.src_ip;
  const dst = basedOn?.dst_ip ?? base.dst_ip;

  return {
    id: crypto.randomUUID(),
    severity: chaos ? 'critical' : (base.severity as any),
    category: chaos ? 'DDoS Mitigation' : base.category,
    src_ip: src,
    dst_ip: dst,
    composite_score: chaos ? clamp(0.9 + Math.random() * 0.09, 0, 0.99) : (base.composite_score as any),
    timestamp: new Date().toISOString(),
    status: 'open',
  };
}

function alertEventToAlertRow(e: AlertEvent): Alert {
  const now = e.timestamp;
  return {
    id: e.id,
    severity: e.severity,
    category: e.category,
    src_ip: e.src_ip,
    dst_ip: e.dst_ip,
    composite_score: e.composite_score,
    label: e.category,
    status: 'open',
    flow_count: Math.floor(10 + Math.random() * 900),
    timestamp: now,
    updated_at: now,
    ai_narrative: e.severity === 'critical'
      ? 'High confidence anomaly consistent with active volumetric disruption. Recommend immediate rate limiting, upstream filtering, and verification of targeted services.'
      : undefined,
  };
}

function tick() {
  const nowMs = Date.now();
  const isInCoolDown = chaosTarget === 0 && nowMs - lastResolveAt < 15000;
  const downRate = isInCoolDown ? 0.02 : 0.04;

  chaosIntensity = lerp(chaosIntensity, chaosTarget, chaosTarget === 1 ? 0.08 : downRate);
  chaosIntensity = clamp(chaosIntensity, 0, 1);

  // Metrics drift + spikes
  if (chaosIntensity > 0.6) {
    packets = 250000 + Math.random() * 50000;
    activeFlowsCount = 8500 + Math.random() * 500;
  } else {
    const drift = isInCoolDown ? 500 : 1000;
    const flowDrift = isInCoolDown ? 18 : 25;
    packets += Math.floor(Math.random() * (drift * 2)) - drift;
    activeFlowsCount += Math.floor(Math.random() * (flowDrift * 2)) - flowDrift;
  }
  packets = Math.max(0, packets);
  activeFlowsCount = Math.max(0, activeFlowsCount);

  const flowEvent = nextFlowEvent(chaosIntensity);
  const flowRow = flowEventToNetworkFlow(flowEvent);

  const flows = [flowRow, ...state.flows].slice(0, MAX_FLOW_ROWS);
  const recentFlows = [...state.recentFlows, flowEvent].slice(-MAX_RECENT_FLOW_EVENTS);
  const nowIso = new Date().toISOString();

  const stats = [...state.stats, pushStatPoint(nowIso, chaosIntensity, flows)].slice(-STATS_POINTS);
  const { protocols, topTalkers } = recomputeAggregates(flows);

  state = {
    ...state,
    chaosIntensity,
    systemStatus: {
      capture_active: true,
      ml_active: true,
      intel_synced: true,
      llm_online: true,
      threat_level: computeThreatLevel(chaosIntensity),
      packets_per_second: Math.round(packets),
      active_flows: Math.round(activeFlowsCount),
    },
    lastFlowEvent: flowEvent,
    recentFlows,
    flows,
    stats,
    protocols,
    topTalkers,
  };

  emitChange();
}

function tickAlert() {
  const intensity = chaosIntensity;
  if (Math.random() > (intensity > 0.6 ? 0.2 : 0.7)) return;

  const e = addSimulatedAlert(intensity, state.lastFlowEvent ?? undefined);
  const row = alertEventToAlertRow(e);

  state = {
    ...state,
    lastAlertEvent: e,
    alerts: [row, ...state.alerts].slice(0, MAX_ALERTS),
  };
  emitChange();
}

function startIfNeeded() {
  if (generatorInterval !== null) return;

  // Listen to demo commands
  unsubTrigger = demoEmitter.on('ANOMALY_TRIGGERED', () => {
    chaosTarget = 1;
    // Immediate convergence & visible incident behavior (no UI change).
    chaosIntensity = Math.max(chaosIntensity, 0.75);
  });
  unsubResolve = demoEmitter.on('ANOMALY_RESOLVED', () => {
    chaosTarget = 0;
    lastResolveAt = Date.now();
    // bring metrics down smoothly rather than snapping
    packets = Math.min(packets, 65000);
    activeFlowsCount = Math.min(activeFlowsCount, 3000);
  });

  generatorInterval = window.setInterval(() => {
    tick();
  }, 600);

  alertInterval = window.setInterval(() => {
    tickAlert();
  }, 1500);
}

function stopIfPossible() {
  if (subscribers > 0) return;

  if (generatorInterval !== null) window.clearInterval(generatorInterval);
  if (alertInterval !== null) window.clearInterval(alertInterval);
  generatorInterval = null;
  alertInterval = null;

  unsubTrigger?.();
  unsubResolve?.();
  unsubTrigger = null;
  unsubResolve = null;
}

export function getDemoSimState(): DemoSimState {
  return state;
}

export function getDemoSimServerState(): DemoSimState {
  return serverState;
}

export function subscribeDemoSim(listener: Listener): () => void {
  subscribers += 1;
  listeners.add(listener);
  // Defer generator startup until after hydration/commit to prevent initial HTML mismatch.
  if (typeof window !== 'undefined') {
    window.setTimeout(() => startIfNeeded(), 0);
  }

  return () => {
    listeners.delete(listener);
    subscribers = Math.max(0, subscribers - 1);
    stopIfPossible();
  };
}

export function updateAlertStatus(id: string, status: Alert['status']) {
  const now = new Date().toISOString();
  state = {
    ...state,
    alerts: state.alerts.map((a) => (a.id === id ? { ...a, status, updated_at: now } : a)),
  };
  emitChange();
}

export function assignAlertToMe(id: string, assignee = 'ANALYST') {
  const now = new Date().toISOString();
  state = {
    ...state,
    alerts: state.alerts.map((a) => (a.id === id ? { ...a, assigned_to: assignee, updated_at: now } : a)),
  };
  emitChange();
}

