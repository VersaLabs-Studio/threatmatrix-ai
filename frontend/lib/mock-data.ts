import type { Alert } from '@/hooks/useAlerts';
import type { NetworkFlow, FlowStats, TopTalker, ProtocolStats } from '@/hooks/useFlows';
import type { AlertStatus, Severity } from '@/lib/constants';

// ── Mock Alerts ──────────────────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-9042',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    updated_at: new Date(Date.now() - 120000).toISOString(),
    severity: 'critical',
    category: 'Data Exfiltration',
    src_ip: '192.168.10.45',
    dst_ip: '45.12.33.102',
    src_port: 5432,
    dst_port: 443,
    composite_score: 0.96,
    label: 'APT-29 Exfiltration',
    status: 'open',
    flow_count: 1420,
    ai_narrative: 'The AI Analyst has correlated this flow with known Midnight Blizzard cloud storage staging behavior (T1567.002). High probability of sensitive database record exfiltration.',
  },
  {
    id: 'ALT-9043',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    updated_at: new Date(Date.now() - 450000).toISOString(),
    severity: 'high',
    category: 'Brute Force',
    src_ip: '185.220.101.4',
    dst_ip: '10.0.1.1',
    src_port: 34512,
    dst_port: 22,
    composite_score: 0.88,
    label: 'SSH Brute Force',
    status: 'investigating',
    assigned_to: 'SOC_L1_AUTO',
    flow_count: 145,
  },
  {
    id: 'ALT-9044',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3000000).toISOString(),
    severity: 'medium',
    category: 'Policy Violation',
    src_ip: '10.0.4.12',
    dst_ip: '10.0.4.1',
    composite_score: 0.65,
    label: 'Unauthorized Config',
    status: 'resolved',
    flow_count: 5,
  },
  {
    id: 'ALT-9045',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86000000).toISOString(),
    severity: 'low',
    category: 'Reconnaissance',
    src_ip: '172.16.8.55',
    dst_ip: '172.16.8.255',
    composite_score: 0.41,
    label: 'Internal Recon',
    status: 'acknowledged',
    flow_count: 254,
  }
];

// Helper to spread flows across the last hour
const now = Date.now();

// ── Mock Network Flows (For Live Feed & Tables) ────────
export const MOCK_FLOWS: NetworkFlow[] = [
  { id: 'flw-01', src_ip: '10.0.1.5',     dst_ip: '104.21.55.12', src_port: 45231, dst_port: 443,  protocol: 'TCP',  duration: 12.4,  src_bytes: 248000,  dst_bytes: 18400,  total_packets: 320,  anomaly_score: 0.94, is_anomaly: true,  label: 'C2 Communication',  timestamp: new Date(now-60000).toISOString(), src_lat: 38.89, src_lon: -77.03, dst_lat: 55.75, dst_lon: 37.61, src_country: 'US', dst_country: 'RU' },
  { id: 'flw-02', src_ip: '185.220.101.4', dst_ip: '10.0.1.5',    src_port: 1234,  dst_port: 22,   protocol: 'TCP',  duration: 8.1,   src_bytes: 5200,    dst_bytes: 2100,   total_packets: 48,   anomaly_score: 0.88, is_anomaly: true,  label: 'SSH Brute Force',   timestamp: new Date(now-120000).toISOString(), src_lat: 52.52, src_lon: 13.40, dst_lat: 38.89, dst_lon: -77.03, src_country: 'DE', dst_country: 'US' },
  { id: 'flw-03', src_ip: '10.0.1.12',    dst_ip: '10.0.1.5',    src_port: 3000,  dst_port: 8080, protocol: 'TCP',  duration: 0.3,   src_bytes: 1200,    dst_bytes: 800,    total_packets: 12,   anomaly_score: 0.08, is_anomaly: false, label: 'Normal',            timestamp: new Date(now-150000).toISOString(), src_lat: 38.89, src_lon: -77.03, dst_lat: 37.77, dst_lon: -122.41, src_country: 'US', dst_country: 'US' },
  { id: 'flw-04', src_ip: '45.33.32.156',  dst_ip: '10.0.1.5',    src_port: 49200, dst_port: 53,   protocol: 'UDP',  duration: 120.0, src_bytes: 145200,  dst_bytes: 86400,  total_packets: 1840, anomaly_score: 0.81, is_anomaly: true,  label: 'DNS Tunneling',     timestamp: new Date(now-200000).toISOString(), src_lat: 31.23, src_lon: 121.47, dst_lat: 38.89, dst_lon: -77.03, src_country: 'CN', dst_country: 'US' },
  { id: 'flw-05', src_ip: '10.0.1.23',    dst_ip: '8.8.8.8',     src_port: 52100, dst_port: 53,   protocol: 'UDP',  duration: 0.1,   src_bytes: 120,     dst_bytes: 160,    total_packets: 2,    anomaly_score: 0.12, is_anomaly: false, label: 'Normal',            timestamp: new Date(now-240000).toISOString(), src_lat: 38.89, src_lon: -77.03, dst_lat: 37.38, dst_lon: -122.08, src_country: 'US', dst_country: 'US' },
  { id: 'flw-06', src_ip: '10.0.1.5',     dst_ip: '192.168.1.1', src_port: 60000, dst_port: 80,   protocol: 'TCP',  duration: 0.5,   src_bytes: 840,     dst_bytes: 4200,   total_packets: 8,    anomaly_score: 0.06, is_anomaly: false, label: 'Normal',            timestamp: new Date(now-280000).toISOString(), src_lat: 38.89, src_lon: -77.03, dst_lat: 38.89, dst_lon: -77.03, src_country: 'US', dst_country: 'US' },
  { id: 'flw-07', src_ip: '203.0.113.42',  dst_ip: '10.0.1.8',    src_port: 45000, dst_port: 8080, protocol: 'TCP',  duration: 35.2,  src_bytes: 980000,  dst_bytes: 24000,  total_packets: 1120, anomaly_score: 0.76, is_anomaly: true,  label: 'Data Exfiltration', timestamp: new Date(now-310000).toISOString(), src_lat: -33.86, src_lon: 151.20, dst_lat: 38.89, dst_lon: -77.03, src_country: 'AU', dst_country: 'US' },
  { id: 'flw-08', src_ip: '10.0.1.5',     dst_ip: '10.0.0.1',    src_port: 34000, dst_port: 161,  protocol: 'UDP',  duration: 0.02,  src_bytes: 84,      dst_bytes: 120,    total_packets: 2,    anomaly_score: 0.03, is_anomaly: false, label: 'Normal',            timestamp: new Date(now-360000).toISOString(), src_lat: 38.89, src_lon: -77.03, dst_lat: 38.89, dst_lon: -77.03, src_country: 'US', dst_country: 'US' },
];

// ── Mock Timeline Stats (For Charts) ─────────────────────
// Generate 60 data points for the last hour
export const MOCK_STATS_TIMELINE: FlowStats[] = Array.from({ length: 60 }).map((_, i) => {
  const t = new Date(now - (60 - i) * 60000).toISOString();
  // Create a spike around 10 minutes ago
  const isSpike = i > 48 && i < 52;
  const basePkt = 12000 + Math.random() * 2000;
  
  return {
    timestamp: t,
    packets_per_second: isSpike ? basePkt * 4 : basePkt,
    bytes_per_second: (isSpike ? basePkt * 4 : basePkt) * 512, // rough correlation
    active_flows: Math.floor(1000 + (isSpike ? 500 : Math.random() * 200)),
    anomaly_count: isSpike ? Math.floor(20 + Math.random() * 10) : Math.floor(Math.random() * 3),
  };
});

// ── Mock Top Talkers ─────────────────────────────────────
export const MOCK_TOP_TALKERS: TopTalker[] = [
  { ip: '192.168.10.45', bytes_total: 45000000000, flow_count: 1420, country: 'US', is_anomalous: true },
  { ip: '10.0.1.12', bytes_total: 1200000000, flow_count: 8500, country: 'US', is_anomalous: false },
  { ip: '185.220.101.4', bytes_total: 85000000, flow_count: 145, country: 'DE', is_anomalous: true },
  { ip: '8.8.8.8', bytes_total: 45000000, flow_count: 12000, country: 'US', is_anomalous: false },
  { ip: '45.33.32.156', bytes_total: 42000000, flow_count: 1840, country: 'CN', is_anomalous: true },
];

// ── Mock Protocol Distribution ───────────────────────────
export const MOCK_PROTOCOLS: ProtocolStats[] = [
  { protocol: 'TCP', count: 85400, percent: 78.4 },
  { protocol: 'UDP', count: 18200, percent: 16.7 },
  { protocol: 'ICMP', count: 4200, percent: 3.8 },
  { protocol: 'QUIC', count: 1100, percent: 1.1 },
];

export const MOCK_INTEL_FEEDS = [
  { id: 'INT-01', actor: 'Midnight Blizzard', type: 'Phishing Campaign', confidence: '98%', status: 'Active Tracking' },
  { id: 'INT-02', actor: 'Scattered Spider', type: 'Social Engineering', confidence: '85%', status: 'Monitoring' },
  { id: 'INT-03', actor: 'Lazarus Group', type: 'Crypto-Jacking', confidence: '92%', status: 'Mitigated' }
];

export interface IOC {
  type: string;
  indicator: string;
  source: string;
  risk: number;
  seen: string;
  tags: string[];
}

export const MOCK_IOCS: IOC[] = [
  { type: 'IP', indicator: '104.21.55.12', source: 'OTX', risk: 88, seen: '2026-03-10', tags: ['C2', 'CobaltStrike'] },
  { type: 'DOMAIN', indicator: 'microsoft-update.security.com', source: 'VirusTotal', risk: 94, seen: '2026-03-11', tags: ['Phishing'] },
  { type: 'HASH', indicator: '7a58e1c...b2e', source: 'Internal', risk: 100, seen: '2026-03-09', tags: ['Ransomware.LockBit'] },
  { type: 'IP', indicator: '185.220.101.4', source: 'AbuseIPDB', risk: 72, seen: '2026-03-12', tags: ['Tor Exit Node'] },
  { type: 'DOMAIN', indicator: 'free-vpn-service.net', source: 'OTX', risk: 45, seen: '2026-03-11', tags: ['Grayware'] },
];
// ── Mock PCAP Uploads (Forensics) ────────────────────────
export const MOCK_PCAP_UPLOADS = [
  { id: 'pcap-01', filename: 'intrusion_attempt_0316.pcap', size: '1.2GB', status: 'completed', anomaly_count: 42, uploaded_at: '2026-03-16T14:20:00Z' },
  { id: 'pcap-02', filename: 'ssh_bruteforce_sample.pcapng', size: '85MB', status: 'completed', anomaly_count: 12, uploaded_at: '2026-03-15T09:15:00Z' },
  { id: 'pcap-03', filename: 'long_term_baselining.pcap', size: '12.4GB', status: 'failed', anomaly_count: 0, uploaded_at: '2026-03-14T18:45:00Z' },
];

export const MOCK_PACKETS = Array.from({ length: 50 }).map((_, i) => ({
  no: i + 1,
  time: (0.001 * i).toFixed(6),
  src: i % 2 === 0 ? '192.168.1.10' : '104.21.55.12',
  dst: i % 2 === 0 ? '104.21.55.12' : '192.168.1.10',
  protocol: i % 5 === 0 ? 'TLSv1.2' : i % 3 === 0 ? 'DNS' : 'TCP',
  length: Math.floor(64 + Math.random() * 1400),
  info: i % 5 === 0 ? 'Application Data' : 'Default Packet Information',
}));

// ── Mock ML Model Ops ────────────────────────────────────
export const MOCK_ML_MODELS = [
  { id: 'mod-01', name: 'Isolation Forest v2.1', type: 'Unsupervised', version: '2.1.4', status: 'active', accuracy: 0.942, trained_at: '2026-03-10' },
  { id: 'mod-02', name: 'Random Forest Classifier', type: 'Supervised', version: '1.0.8', status: 'active', accuracy: 0.915, trained_at: '2026-03-05' },
  { id: 'mod-03', name: 'AutoEncoder Deep Neural', type: 'Deep Learning', version: '0.9.2', status: 'retired', accuracy: 0.894, trained_at: '2026-02-28' },
];

export const MOCK_MODEL_COMPARISON = [
  { metric: 'Precision', champion: 'AE', AE: 0.94, RF: 0.91, IF: 0.88 },
  { metric: 'Recall', champion: 'IF', AE: 0.82, RF: 0.85, IF: 0.92 },
  { metric: 'F1-Score', champion: 'RF', AE: 0.88, RF: 0.91, IF: 0.86 },
  { metric: 'Inference Time (ms)', champion: 'IF', AE: 12.4, RF: 8.2, IF: 1.5 },
  { metric: 'AUC-ROC', champion: 'AE', AE: 0.96, RF: 0.94, IF: 0.91 },
];

export const MOCK_CONFUSION_MATRIX = [
  { actual: 'Normal', pred_normal: 85240, pred_anomaly: 160 },
  { actual: 'Anomaly', pred_normal: 42, pred_anomaly: 1558 },
];

export const MOCK_ROC_DATA = Array.from({ length: 20 }).map((_, i) => ({
  x: i / 19,
  IF: Math.pow(i / 19, 0.5),
  RF: Math.pow(i / 19, 0.45),
  AE: Math.pow(i / 19, 0.4),
}));
// ── Mock Reports (Week 6) ───────────────────────────────
export const MOCK_REPORTS = [
  { id: 'rep-01', name: 'Daily Threat Summary', type: 'Daily', date: '2026-03-16', status: 'completed', size: '2.4 MB' },
  { id: 'rep-02', name: 'Weekly Incident Report', type: 'Weekly', date: '2026-03-15', status: 'completed', size: '14.8 MB' },
  { id: 'rep-03', name: 'ML Drift Analysis', type: 'Performance', date: '2026-03-14', status: 'failed', size: '0 KB' },
  { id: 'rep-04', name: 'Executive Cybersecurity Brief', type: 'Executive', date: '2026-03-01', status: 'completed', size: '1.1 MB' },
];

export const MOCK_ADMIN_USERS = [
  { id: 'usr-01', name: 'Caleb Demelash', email: 'caleb@threatmatrix.ai', role: 'admin', last_active: '2026-03-17 11:15', status: 'active' },
  { id: 'usr-02', name: 'Kidus Yosef', email: 'kidus@threatmatrix.ai', role: 'soc_manager', last_active: '2026-03-17 09:30', status: 'active' },
  { id: 'usr-03', name: 'Dinaol Seyuom', email: 'dinaol@threatmatrix.ai', role: 'viewer', last_active: '2026-03-17 10:05', status: 'active' },
  { id: 'usr-04', name: 'Kirubel Tewdros', email: 'kirubel@threatmatrix.ai', role: 'analyst', last_active: '2026-03-17 12:00', status: 'active' },
];

export const MOCK_LLM_USAGE = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
  val: 5 + Math.random() * 15
}));

export const MOCK_AUDIT_LOGS = [
  { id: 'aud-01', actor: 'caleb@threatmatrix.ai', action: 'LOGIN_SUCCESS', resource: 'AUTH_SERVICE', timestamp: '2026-03-17 11:10:02', ip: '192.168.1.5' },
  { id: 'aud-02', actor: 'kidus@threatmatrix.ai', action: 'UPDATE_ALERT_STATUS', resource: 'ALERT_ALT-9042', timestamp: '2026-03-17 10:45:15', ip: '192.168.1.12' },
  { id: 'aud-03', actor: 'system', action: 'PROVISION_LLM_TOKENS', resource: 'BILLING', timestamp: '2026-03-17 00:00:00', ip: 'internal' },
  { id: 'aud-04', actor: 'caleb@threatmatrix.ai', action: 'DELETE_MOCK_DATA', resource: 'DATABASE', timestamp: '2026-03-17 11:14:30', ip: '192.168.1.5' },
];
