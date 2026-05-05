// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — Comprehensive Mock Data for Demo
// Realistic cybersecurity data for all 9+ modules
// ═══════════════════════════════════════════════════════

import type {
  AlertResponse,
  NetworkFlow,
  FlowResponse,
  TopTalker,
  ProtocolStats,
  FlowStatsResponse,
  IOCResponse,
  MLModelDetail,
  MLComparisonResponse,
  MLConfusionMatrixResponse,
  PCAPUploadResponse,
  SystemHealth,
} from './types';
import type { Severity, AlertStatus } from './constants';

// ── Helper ──────────────────────────────────────────────
function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
function randBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ══════════════════════════════════════════════════════════
// ALERTS — 25 realistic alerts with full ML scores & AI narratives
// ══════════════════════════════════════════════════════════

const ALERT_TEMPLATES: Array<{
  severity: Severity;
  category: string;
  title: string;
  description: string;
  source_ip: string;
  dest_ip: string;
  composite_score: number;
  if_score: number;
  rf_score: number;
  ae_score: number;
  rf_label: string;
  rf_confidence: number;
  model_agreement: 'unanimous' | 'majority' | 'single' | 'none';
  status: AlertStatus;
  resolution_note?: string;
  ai_narrative: string;
  minutesAgo: number;
}> = [
  {
    severity: 'critical',
    category: 'ddos',
    title: 'CRITICAL — Volumetric DDoS SYN Flood Detected',
    description: 'ML ensemble detected massive SYN flood targeting web server. 14,800 SYN packets in 45 seconds from distributed sources.',
    source_ip: '103.45.67.89',
    dest_ip: '196.188.1.10',
    composite_score: 0.94,
    if_score: 0.91,
    rf_score: 0.96,
    ae_score: 0.95,
    rf_label: 'dos',
    rf_confidence: 0.96,
    model_agreement: 'unanimous',
    status: 'open',
    ai_narrative: `## Threat Analysis — DDoS SYN Flood

**Severity:** CRITICAL | **Confidence:** 94%

### What Happened
The ML ensemble detected a volumetric SYN flood attack targeting your web server at \`196.188.1.10\`. Source IP \`103.45.67.89\` sent 14,800 SYN packets within a 45-second window, overwhelming the TCP connection table. All three models flagged this as anomalous with unanimous agreement.

### Why This Is Dangerous
SYN floods exhaust server resources by filling the connection queue with half-open connections. This can cause complete service unavailability for legitimate users. The attack volume suggests an automated botnet tool (likely hping3 or LOIC).

### Recommended Actions
1. **Immediate:** Block source IP \`103.45.67.89\` at the firewall
2. **Short-term:** Enable SYN cookies on the affected server
3. **Long-term:** Deploy rate limiting on SYN packets per source IP`,
    minutesAgo: 3,
  },
  {
    severity: 'critical',
    category: 'c2',
    title: 'CRITICAL — C2 Beacon Communication Detected',
    description: 'Encrypted periodic outbound connections to known Cobalt Strike C2 server detected from internal host.',
    source_ip: '10.0.1.47',
    dest_ip: '185.220.101.34',
    composite_score: 0.92,
    if_score: 0.88,
    rf_score: 0.94,
    ae_score: 0.93,
    rf_label: 'probe',
    rf_confidence: 0.82,
    model_agreement: 'unanimous',
    status: 'investigating',
    ai_narrative: `## Threat Analysis — C2 Beacon

**Severity:** CRITICAL | **Confidence:** 92%

### What Happened
Internal host \`10.0.1.47\` is making periodic encrypted outbound connections to \`185.220.101.34\`, a known Cobalt Strike command-and-control server. The beacon interval is approximately 60 seconds with jitter, matching Cobalt Strike Malleable C2 profile patterns.

### Why This Is Dangerous
C2 beaconing indicates the host is already compromised and is receiving commands from an attacker. This could lead to data exfiltration, lateral movement, or ransomware deployment.

### Recommended Actions
1. **Immediate:** Isolate host \`10.0.1.47\` from the network
2. **Capture:** Run full memory dump for forensic analysis
3. **Investigate:** Check for lateral movement to adjacent hosts`,
    minutesAgo: 12,
  },
  {
    severity: 'high',
    category: 'port_scan',
    title: 'HIGH — Multi-Port SYN Scan Detected',
    description: 'External IP conducting SYN scan across 1,024 well-known ports. 1,024 SYN packets with no completion.',
    source_ip: '187.124.45.161',
    dest_ip: '196.188.1.10',
    composite_score: 0.78,
    if_score: 0.72,
    rf_score: 0.81,
    ae_score: 0.80,
    rf_label: 'probe',
    rf_confidence: 0.81,
    model_agreement: 'majority',
    status: 'acknowledged',
    ai_narrative: `## Threat Analysis — Port Scan

**Severity:** HIGH | **Confidence:** 78%

### What Happened
A systematic SYN port scan was detected from \`187.124.45.161\` targeting \`196.188.1.10\`. The scanner sent SYN packets to ports 1-1024 without completing the TCP handshake — classic half-open scan behavior consistent with nmap -sS.

### Recommended Actions
1. Block scanning IP at perimeter firewall
2. Review open ports on target host
3. Enable port scan detection rules in IDS`,
    minutesAgo: 18,
  },
  {
    severity: 'high',
    category: 'brute_force',
    title: 'HIGH — SSH Brute Force Attack in Progress',
    description: '847 failed SSH login attempts from single IP within 5 minutes. Dictionary attack pattern detected.',
    source_ip: '91.134.200.55',
    dest_ip: '196.188.1.10',
    composite_score: 0.82,
    if_score: 0.79,
    rf_score: 0.85,
    ae_score: 0.83,
    rf_label: 'r2l',
    rf_confidence: 0.78,
    model_agreement: 'unanimous',
    status: 'open',
    ai_narrative: `## Threat Analysis — SSH Brute Force

**Severity:** HIGH | **Confidence:** 82%

### What Happened
A sustained SSH brute force attack was detected from \`91.134.200.55\`. The attacker attempted 847 login combinations against the SSH daemon on \`196.188.1.10:22\` within a 5-minute window. The pattern shows automated dictionary attack tooling (likely Hydra or Medusa).

### Recommended Actions
1. **Immediate:** Block IP \`91.134.200.55\` and implement fail2ban
2. **Disable** password authentication; enforce key-based SSH
3. **Move** SSH to a non-standard port`,
    minutesAgo: 25,
  },
  {
    severity: 'high',
    category: 'dns_tunnel',
    title: 'HIGH — DNS Tunneling Data Exfiltration Suspected',
    description: 'High-entropy DNS queries to suspicious domain. 847 TXT queries with 200+ byte payloads detected.',
    source_ip: '10.0.1.23',
    dest_ip: '8.8.8.8',
    composite_score: 0.76,
    if_score: 0.71,
    rf_score: 0.79,
    ae_score: 0.78,
    rf_label: 'probe',
    rf_confidence: 0.72,
    model_agreement: 'majority',
    status: 'investigating',
    ai_narrative: `## Threat Analysis — DNS Tunneling

**Severity:** HIGH | **Confidence:** 76%

### What Happened
Host \`10.0.1.23\` generated 847 DNS TXT queries to suspicious domains with unusually high entropy (Shannon entropy > 4.5 bits/byte). The query payloads exceed 200 bytes — far larger than normal DNS traffic. This pattern is consistent with DNS tunneling tools like iodine or dnscat2.

### Recommended Actions
1. Block the suspicious domain at DNS level
2. Investigate host \`10.0.1.23\` for malware
3. Implement DNS query length monitoring`,
    minutesAgo: 35,
  },
  {
    severity: 'medium',
    category: 'data_exfiltration',
    title: 'MEDIUM — Unusual Outbound Data Transfer Volume',
    description: 'Internal host uploaded 2.3 GB to external IP in 10 minutes. Abnormal for this host baseline.',
    source_ip: '10.0.1.15',
    dest_ip: '45.33.32.156',
    composite_score: 0.58,
    if_score: 0.52,
    rf_score: 0.61,
    ae_score: 0.60,
    rf_label: 'normal',
    rf_confidence: 0.55,
    model_agreement: 'single',
    status: 'open',
    ai_narrative: `## Threat Analysis — Data Exfiltration

**Severity:** MEDIUM | **Confidence:** 58%

### What Happened
Host \`10.0.1.15\` transferred 2.3 GB of data to external IP \`45.33.32.156\` within a 10-minute window. This is 47x above the normal outbound baseline for this host. While the destination could be a legitimate cloud service, the volume warrants investigation.

### Recommended Actions
1. Verify the destination IP ownership
2. Check what data was transferred
3. Review host for unauthorized software`,
    minutesAgo: 42,
  },
  {
    severity: 'medium',
    category: 'malware',
    title: 'MEDIUM — Suspicious PowerShell Download Cradle',
    description: 'Encoded PowerShell command downloading executable from remote server detected in network traffic.',
    source_ip: '10.0.1.33',
    dest_ip: '198.51.100.23',
    composite_score: 0.63,
    if_score: 0.58,
    rf_score: 0.67,
    ae_score: 0.64,
    rf_label: 'probe',
    rf_confidence: 0.60,
    model_agreement: 'majority',
    status: 'acknowledged',
    ai_narrative: `## Threat Analysis — PowerShell Malware Delivery

**Severity:** MEDIUM | **Confidence:** 63%

### What Happened
Network inspection detected an encoded PowerShell download cradle targeting host \`10.0.1.33\`. The command attempted to download a binary from \`198.51.100.23\` using \`Invoke-WebRequest\` with Base64 encoding to evade detection.

### Recommended Actions
1. Isolate the affected host
2. Run full antivirus scan
3. Block the download URL`,
    minutesAgo: 55,
  },
  {
    severity: 'medium',
    category: 'port_scan',
    title: 'MEDIUM — Vertical Port Scan on Single Host',
    description: 'Sequential port scan on ports 1-65535 from internal IP. Service enumeration attempt.',
    source_ip: '10.0.1.88',
    dest_ip: '10.0.1.1',
    composite_score: 0.54,
    if_score: 0.49,
    rf_score: 0.58,
    ae_score: 0.55,
    rf_label: 'probe',
    rf_confidence: 0.58,
    model_agreement: 'single',
    status: 'open',
    ai_narrative: `## Threat Analysis — Internal Port Scan

**Severity:** MEDIUM | **Confidence:** 54%

### What Happened
Internal host \`10.0.1.88\` is scanning all 65,535 ports on the gateway \`10.0.1.1\`. This could indicate an insider threat or a compromised internal machine performing reconnaissance.

### Recommended Actions
1. Identify the user of host 10.0.1.88
2. Check for unauthorized scanning tools
3. Review network segmentation`,
    minutesAgo: 68,
  },
  {
    severity: 'low',
    category: 'anomaly',
    title: 'LOW — Unusual DNS Query Pattern',
    description: 'Spike in DNS queries to non-standard resolvers. 340 queries to 1.1.1.3 in 5 minutes.',
    source_ip: '10.0.1.52',
    dest_ip: '1.1.1.3',
    composite_score: 0.35,
    if_score: 0.31,
    rf_score: 0.38,
    ae_score: 0.36,
    rf_label: 'normal',
    rf_confidence: 0.45,
    model_agreement: 'none',
    status: 'open',
    ai_narrative: `## Threat Analysis — DNS Anomaly

**Severity:** LOW | **Confidence:** 35%

### What Happened
Host \`10.0.1.52\` sent 340 DNS queries to \`1.1.1.3\` (Cloudflare malware-blocking resolver) within 5 minutes. While not inherently malicious, this deviates from the network baseline where \`8.8.8.8\` is the standard resolver.

### Recommended Actions
1. Verify if this is a legitimate configuration change
2. Monitor for escalation`,
    minutesAgo: 90,
  },
  {
    severity: 'medium',
    category: 'brute_force',
    title: 'MEDIUM — FTP Login Brute Force Attempt',
    description: '234 failed FTP login attempts detected. Credential stuffing pattern with common usernames.',
    source_ip: '195.154.179.42',
    dest_ip: '196.188.1.10',
    composite_score: 0.56,
    if_score: 0.51,
    rf_score: 0.60,
    ae_score: 0.57,
    rf_label: 'r2l',
    rf_confidence: 0.55,
    model_agreement: 'single',
    status: 'resolved',
    resolution_note: 'Blocked source IP via firewall rule. Disabled FTP service.',
    ai_narrative: `## Threat Analysis — FTP Brute Force

**Severity:** MEDIUM | **Confidence:** 56%

### What Happened
Automated credential stuffing attack against FTP service on \`196.188.1.10:21\` from \`195.154.179.42\`. 234 failed attempts using common usernames (admin, root, ftp, user, test).

### Recommended Actions
1. Disable FTP; use SFTP instead
2. Implement account lockout policy`,
    minutesAgo: 120,
  },
  // More alerts to reach 25
  {
    severity: 'critical',
    category: 'ransomware',
    title: 'CRITICAL — Ransomware Lateral Movement Detected',
    description: 'SMB exploit attempt (EternalBlue) detected from compromised host to 3 internal servers.',
    source_ip: '10.0.1.47',
    dest_ip: '10.0.1.50',
    composite_score: 0.96,
    if_score: 0.93,
    rf_score: 0.97,
    ae_score: 0.97,
    rf_label: 'dos',
    rf_confidence: 0.92,
    model_agreement: 'unanimous',
    status: 'open',
    ai_narrative: `## CRITICAL — Ransomware Propagation

Host \`10.0.1.47\` (previously flagged for C2) is now attempting EternalBlue exploits against internal SMB services. This indicates active ransomware deployment. **IMMEDIATE ACTION REQUIRED**: Isolate all affected hosts and disable SMBv1.`,
    minutesAgo: 5,
  },
  {
    severity: 'high',
    category: 'phishing',
    title: 'HIGH — Phishing Domain Communication Detected',
    description: 'Employee accessed known phishing domain mimicking Commercial Bank of Ethiopia.',
    source_ip: '10.0.1.72',
    dest_ip: '185.100.87.41',
    composite_score: 0.74,
    if_score: 0.68,
    rf_score: 0.78,
    ae_score: 0.76,
    rf_label: 'probe',
    rf_confidence: 0.70,
    model_agreement: 'majority',
    status: 'acknowledged',
    ai_narrative: `## HIGH — Phishing Domain Access

Host \`10.0.1.72\` communicated with \`185.100.87.41\`, which hosts a domain impersonating CBE (Commercial Bank of Ethiopia). This likely indicates a phishing credential harvest. User training and credential reset recommended.`,
    minutesAgo: 45,
  },
  {
    severity: 'medium',
    category: 'cryptojacking',
    title: 'MEDIUM — Cryptocurrency Mining Traffic Detected',
    description: 'Stratum protocol traffic to known mining pool. 45 MH/s hashrate estimated.',
    source_ip: '10.0.1.91',
    dest_ip: '104.248.42.199',
    composite_score: 0.61,
    if_score: 0.56,
    rf_score: 0.64,
    ae_score: 0.63,
    rf_label: 'normal',
    rf_confidence: 0.52,
    model_agreement: 'single',
    status: 'open',
    ai_narrative: `## MEDIUM — Cryptojacking

Host \`10.0.1.91\` is communicating with a known mining pool at \`104.248.42.199\` using the Stratum protocol. This indicates unauthorized cryptocurrency mining consuming system resources.`,
    minutesAgo: 78,
  },
  {
    severity: 'low',
    category: 'anomaly',
    title: 'LOW — After-Hours Network Activity Spike',
    description: 'Network traffic 340% above baseline at 02:14 AM. Non-business hours activity.',
    source_ip: '10.0.1.15',
    dest_ip: '142.250.185.46',
    composite_score: 0.32,
    if_score: 0.28,
    rf_score: 0.35,
    ae_score: 0.33,
    rf_label: 'normal',
    rf_confidence: 0.40,
    model_agreement: 'none',
    status: 'resolved',
    resolution_note: 'Confirmed as scheduled backup job to Google Cloud.',
    ai_narrative: `## LOW — After-Hours Activity

Traffic spike at 02:14 AM was identified as a scheduled backup to Google Cloud Storage. No malicious activity detected.`,
    minutesAgo: 180,
  },
  {
    severity: 'medium',
    category: 'port_scan',
    title: 'MEDIUM — UDP Scan Detected on DNS Port',
    description: 'UDP scan targeting port 53 from external source. DNS enumeration attempt.',
    source_ip: '209.17.96.50',
    dest_ip: '196.188.1.10',
    composite_score: 0.52,
    if_score: 0.47,
    rf_score: 0.55,
    ae_score: 0.54,
    rf_label: 'probe',
    rf_confidence: 0.55,
    model_agreement: 'single',
    status: 'open',
    ai_narrative: `## MEDIUM — DNS Enumeration

External IP scanning DNS service. Could be reconnaissance for DNS zone transfer or cache poisoning attacks.`,
    minutesAgo: 100,
  },
  {
    severity: 'high',
    category: 'c2',
    title: 'HIGH — Cobalt Strike SMB Beacon Detected',
    description: 'Named pipe communication pattern matching Cobalt Strike SMB beacon over internal network.',
    source_ip: '10.0.1.47',
    dest_ip: '10.0.1.60',
    composite_score: 0.85,
    if_score: 0.81,
    rf_score: 0.88,
    ae_score: 0.86,
    rf_label: 'probe',
    rf_confidence: 0.80,
    model_agreement: 'unanimous',
    status: 'investigating',
    ai_narrative: `## HIGH — Internal C2 Lateral Movement

Cobalt Strike SMB beacon detected between compromised host and file server. Active lateral movement in progress.`,
    minutesAgo: 8,
  },
  {
    severity: 'medium',
    category: 'data_exfiltration',
    title: 'MEDIUM — Large DNS TXT Record Queries',
    description: 'Base64-encoded data in DNS TXT queries. 2.1 KB average query size indicates tunneling.',
    source_ip: '10.0.1.33',
    dest_ip: '8.8.4.4',
    composite_score: 0.59,
    if_score: 0.54,
    rf_score: 0.62,
    ae_score: 0.61,
    rf_label: 'probe',
    rf_confidence: 0.58,
    model_agreement: 'majority',
    status: 'open',
    ai_narrative: `## MEDIUM — DNS Data Exfiltration

Host using DNS TXT records to exfiltrate data. Base64 encoding detected in query payloads. Possible data theft via DNS tunneling.`,
    minutesAgo: 50,
  },
  {
    severity: 'low',
    category: 'anomaly',
    title: 'LOW — TLS Certificate Anomaly',
    description: 'Self-signed certificate detected on internal web server. Possible MITM or misconfiguration.',
    source_ip: '10.0.1.10',
    dest_ip: '10.0.1.72',
    composite_score: 0.33,
    if_score: 0.29,
    rf_score: 0.36,
    ae_score: 0.34,
    rf_label: 'normal',
    rf_confidence: 0.42,
    model_agreement: 'none',
    status: 'false_positive',
    resolution_note: 'Dev team self-signed cert for staging environment. Expected.',
    ai_narrative: `## LOW — TLS Anomaly

Self-signed certificate on internal staging server. Development environment configuration, not a security threat.`,
    minutesAgo: 240,
  },
  {
    severity: 'high',
    category: 'malware',
    title: 'HIGH — Emotet Malware C2 Traffic Pattern',
    description: 'HTTP POST pattern matching Emotet Epoch 4 C2 communication. Encoded binary payload detected.',
    source_ip: '10.0.1.55',
    dest_ip: '103.28.36.14',
    composite_score: 0.80,
    if_score: 0.76,
    rf_score: 0.83,
    ae_score: 0.81,
    rf_label: 'probe',
    rf_confidence: 0.75,
    model_agreement: 'majority',
    status: 'open',
    ai_narrative: `## HIGH — Emotet Malware

Traffic pattern matches Emotet botnet C2 communication. Host likely infected via phishing email. Immediate isolation recommended.`,
    minutesAgo: 30,
  },
  {
    severity: 'medium',
    category: 'brute_force',
    title: 'MEDIUM — RDP Brute Force from Eastern Europe',
    description: '156 RDP login attempts from Romanian IP. NLA bypass attempt detected.',
    source_ip: '89.40.182.15',
    dest_ip: '196.188.1.10',
    composite_score: 0.57,
    if_score: 0.52,
    rf_score: 0.61,
    ae_score: 0.58,
    rf_label: 'r2l',
    rf_confidence: 0.56,
    model_agreement: 'single',
    status: 'acknowledged',
    ai_narrative: `## MEDIUM — RDP Brute Force

Automated RDP credential attack from Romania. Enable NLA, use VPN for remote access, implement account lockout.`,
    minutesAgo: 65,
  },
  {
    severity: 'info',
    category: 'reconnaissance',
    title: 'INFO — WHOIS Lookup from Threat Actor',
    description: 'WHOIS query for organizational IP range from known threat intelligence actor.',
    source_ip: '198.51.100.100',
    dest_ip: '196.188.1.1',
    composite_score: 0.25,
    if_score: 0.22,
    rf_score: 0.28,
    ae_score: 0.25,
    rf_label: 'normal',
    rf_confidence: 0.35,
    model_agreement: 'none',
    status: 'open',
    ai_narrative: `## INFO — Reconnaissance Activity

WHOIS enumeration detected. Early-stage reconnaissance. Monitor for escalation to active scanning.`,
    minutesAgo: 150,
  },
  {
    severity: 'medium',
    category: 'ddos',
    title: 'MEDIUM — HTTP Slowloris Attack Attempt',
    description: 'Slow HTTP headers keeping connections open. 450 partial connections detected.',
    source_ip: '78.128.113.42',
    dest_ip: '196.188.1.10',
    composite_score: 0.55,
    if_score: 0.50,
    rf_score: 0.59,
    ae_score: 0.56,
    rf_label: 'dos',
    rf_confidence: 0.54,
    model_agreement: 'single',
    status: 'open',
    ai_narrative: `## MEDIUM — Slowloris Attack

Slow HTTP attack keeping connections alive with incomplete headers. Configure web server timeout limits and connection limits per IP.`,
    minutesAgo: 88,
  },
  {
    severity: 'high',
    category: 'supply_chain',
    title: 'HIGH — Suspicious Software Update from Untrusted Source',
    description: 'Software update downloaded from IP not matching vendor CDN. Possible supply chain compromise.',
    source_ip: '10.0.1.40',
    dest_ip: '91.234.99.12',
    composite_score: 0.77,
    if_score: 0.73,
    rf_score: 0.80,
    ae_score: 0.78,
    rf_label: 'probe',
    rf_confidence: 0.72,
    model_agreement: 'majority',
    status: 'open',
    ai_narrative: `## HIGH — Supply Chain Risk

Software update binary downloaded from untrusted IP instead of official vendor CDN. Hash verification needed immediately.`,
    minutesAgo: 15,
  },
  {
    severity: 'critical',
    category: 'insider',
    title: 'CRITICAL — Mass Database Export After Hours',
    description: 'DBA account exported 4.2 GB of customer data at 11:47 PM. No change request filed.',
    source_ip: '10.0.1.5',
    dest_ip: '10.0.1.200',
    composite_score: 0.91,
    if_score: 0.87,
    rf_score: 0.93,
    ae_score: 0.92,
    rf_label: 'dos',
    rf_confidence: 0.88,
    model_agreement: 'unanimous',
    status: 'investigating',
    ai_narrative: `## CRITICAL — Insider Threat

Massive database export detected outside business hours with no corresponding change request. Potential data theft by insider. Immediate investigation required.`,
    minutesAgo: 20,
  },
];

export const MOCK_ALERTS: AlertResponse[] = ALERT_TEMPLATES.map((t, i) => ({
  id: `mock-alert-${String(i + 1).padStart(3, '0')}`,
  alert_id: `TM-20260429${String(1900 - t.minutesAgo).padStart(6, '0')}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
  severity: t.severity,
  title: t.title,
  description: t.description,
  category: t.category,
  source_ip: t.source_ip,
  dest_ip: t.dest_ip,
  confidence: t.composite_score,
  status: t.status,
  resolution_note: t.resolution_note,
  ml_model: 'ensemble',
  ai_narrative: t.ai_narrative,
  composite_score: t.composite_score,
  if_score: t.if_score,
  rf_score: t.rf_score,
  ae_score: t.ae_score,
  rf_label: t.rf_label,
  rf_confidence: t.rf_confidence,
  model_agreement: t.model_agreement,
  label: t.rf_label,
  flow_count: Math.floor(Math.random() * 50) + 5,
  created_at: ago(t.minutesAgo),
  updated_at: ago(t.minutesAgo - 2),
}));

// ══════════════════════════════════════════════════════════
// NETWORK FLOWS — 50 realistic flows
// ══════════════════════════════════════════════════════════

const FLOW_TEMPLATES = [
  { src: '103.45.67.89', dst: '196.188.1.10', sp: 44832, dp: 80, proto: 'TCP', dur: 0.003, bytes: 54, pkts: 1, anomalous: true, score: 0.94, label: 'dos' },
  { src: '185.220.101.34', dst: '10.0.1.47', sp: 443, dp: 49832, proto: 'TCP', dur: 12.5, bytes: 8420, pkts: 24, anomalous: true, score: 0.87, label: 'probe' },
  { src: '10.0.1.47', dst: '185.220.101.34', sp: 49832, dp: 443, proto: 'TCP', dur: 12.5, bytes: 3210, pkts: 18, anomalous: true, score: 0.85, label: 'probe' },
  { src: '187.124.45.161', dst: '196.188.1.10', sp: 51234, dp: 22, proto: 'TCP', dur: 0.001, bytes: 44, pkts: 1, anomalous: true, score: 0.78, label: 'probe' },
  { src: '91.134.200.55', dst: '196.188.1.10', sp: 42156, dp: 22, proto: 'TCP', dur: 0.0, bytes: 0, pkts: 1, anomalous: true, score: 0.82, label: 'r2l' },
  { src: '10.0.1.23', dst: '8.8.8.8', sp: 53421, dp: 53, proto: 'UDP', dur: 0.05, bytes: 2847, pkts: 3, anomalous: true, score: 0.76, label: 'probe' },
  { src: '10.0.1.15', dst: '45.33.32.156', sp: 52341, dp: 443, proto: 'TCP', dur: 342.7, bytes: 2457600000, pkts: 1842000, anomalous: true, score: 0.58, label: 'normal' },
  { src: '10.0.1.88', dst: '10.0.1.1', sp: 48234, dp: 80, proto: 'TCP', dur: 0.002, bytes: 44, pkts: 1, anomalous: true, score: 0.54, label: 'probe' },
  // Normal traffic
  { src: '10.0.1.52', dst: '142.250.185.46', sp: 52341, dp: 443, proto: 'TCP', dur: 2.3, bytes: 128000, pkts: 85, anomalous: false, score: 0.12, label: 'normal' },
  { src: '10.0.1.15', dst: '142.250.185.46', sp: 53422, dp: 443, proto: 'TCP', dur: 1.8, bytes: 95000, pkts: 62, anomalous: false, score: 0.08, label: 'normal' },
  { src: '10.0.1.72', dst: '157.240.1.35', sp: 54123, dp: 443, proto: 'TCP', dur: 3.1, bytes: 234000, pkts: 145, anomalous: false, score: 0.15, label: 'normal' },
  { src: '10.0.1.33', dst: '13.107.42.14', sp: 49823, dp: 443, proto: 'TCP', dur: 0.9, bytes: 45000, pkts: 32, anomalous: false, score: 0.10, label: 'normal' },
  { src: '10.0.1.40', dst: '34.120.195.249', sp: 51234, dp: 443, proto: 'TCP', dur: 15.2, bytes: 567000, pkts: 389, anomalous: false, score: 0.18, label: 'normal' },
  { src: '10.0.1.91', dst: '104.248.42.199', sp: 3333, dp: 3333, proto: 'TCP', dur: 847.2, bytes: 1245000, pkts: 8923, anomalous: true, score: 0.61, label: 'normal' },
  { src: '10.0.1.5', dst: '10.0.1.200', sp: 54321, dp: 5432, proto: 'TCP', dur: 45.3, bytes: 4509715456, pkts: 3421000, anomalous: true, score: 0.91, label: 'dos' },
  // Ethiopian internal traffic
  { src: '196.188.1.10', dst: '10.0.1.52', sp: 80, dp: 52341, proto: 'TCP', dur: 2.3, bytes: 890000, pkts: 612, anomalous: false, score: 0.05, label: 'normal' },
  { src: '196.188.1.10', dst: '10.0.1.15', sp: 443, dp: 53422, proto: 'TCP', dur: 1.8, bytes: 534000, pkts: 378, anomalous: false, score: 0.07, label: 'normal' },
  { src: '10.0.1.1', dst: '10.0.1.88', sp: 53, dp: 48234, proto: 'UDP', dur: 0.01, bytes: 245, pkts: 1, anomalous: false, score: 0.04, label: 'normal' },
  { src: '10.0.1.60', dst: '10.0.1.47', sp: 445, dp: 49833, proto: 'TCP', dur: 0.8, bytes: 12400, pkts: 8, anomalous: true, score: 0.85, label: 'probe' },
  // More normal traffic
  { src: '10.0.1.20', dst: '104.16.132.229', sp: 49845, dp: 443, proto: 'TCP', dur: 1.2, bytes: 67000, pkts: 45, anomalous: false, score: 0.09, label: 'normal' },
  { src: '10.0.1.25', dst: '151.101.1.69', sp: 50123, dp: 443, proto: 'TCP', dur: 0.7, bytes: 34000, pkts: 23, anomalous: false, score: 0.06, label: 'normal' },
  { src: '10.0.1.30', dst: '140.82.121.4', sp: 51456, dp: 443, proto: 'TCP', dur: 2.8, bytes: 189000, pkts: 124, anomalous: false, score: 0.11, label: 'normal' },
  { src: '10.0.1.35', dst: '35.186.224.25', sp: 52678, dp: 443, proto: 'TCP', dur: 4.1, bytes: 456000, pkts: 298, anomalous: false, score: 0.14, label: 'normal' },
  { src: '10.0.1.45', dst: '172.217.14.206', sp: 53890, dp: 443, proto: 'TCP', dur: 1.5, bytes: 78000, pkts: 52, anomalous: false, score: 0.08, label: 'normal' },
  { src: '10.0.1.50', dst: '52.96.108.10', sp: 49234, dp: 443, proto: 'TCP', dur: 3.2, bytes: 267000, pkts: 178, anomalous: false, score: 0.13, label: 'normal' },
  { src: '10.0.1.55', dst: '103.28.36.14', sp: 8080, dp: 80, proto: 'TCP', dur: 0.3, bytes: 8900, pkts: 6, anomalous: true, score: 0.80, label: 'probe' },
  { src: '10.0.1.65', dst: '93.184.216.34', sp: 54567, dp: 443, proto: 'TCP', dur: 2.0, bytes: 123000, pkts: 82, anomalous: false, score: 0.10, label: 'normal' },
  { src: '10.0.1.70', dst: '208.67.222.222', sp: 53, dp: 53, proto: 'UDP', dur: 0.02, bytes: 312, pkts: 1, anomalous: false, score: 0.03, label: 'normal' },
  { src: '10.0.1.75', dst: '23.63.254.150', sp: 49567, dp: 443, proto: 'TCP', dur: 1.1, bytes: 56000, pkts: 38, anomalous: false, score: 0.07, label: 'normal' },
  { src: '10.0.1.80', dst: '104.18.26.46', sp: 50234, dp: 443, proto: 'TCP', dur: 0.6, bytes: 28000, pkts: 19, anomalous: false, score: 0.05, label: 'normal' },
  { src: '10.0.1.85', dst: '199.232.69.194', sp: 51345, dp: 443, proto: 'TCP', dur: 1.9, bytes: 112000, pkts: 74, anomalous: false, score: 0.09, label: 'normal' },
  { src: '10.0.1.90', dst: '151.101.129.69', sp: 52456, dp: 443, proto: 'TCP', dur: 2.4, bytes: 178000, pkts: 118, anomalous: false, score: 0.12, label: 'normal' },
  { src: '10.0.1.95', dst: '34.117.59.81', sp: 53567, dp: 443, proto: 'TCP', dur: 3.5, bytes: 345000, pkts: 228, anomalous: false, score: 0.15, label: 'normal' },
  { src: '10.0.1.100', dst: '18.66.147.49', sp: 54678, dp: 443, proto: 'TCP', dur: 1.3, bytes: 67000, pkts: 44, anomalous: false, score: 0.08, label: 'normal' },
  // More attacks
  { src: '78.128.113.42', dst: '196.188.1.10', sp: 42567, dp: 80, proto: 'TCP', dur: 180.0, bytes: 234, pkts: 450, anomalous: true, score: 0.55, label: 'dos' },
  { src: '89.40.182.15', dst: '196.188.1.10', sp: 48923, dp: 3389, proto: 'TCP', dur: 0.001, bytes: 0, pkts: 1, anomalous: true, score: 0.57, label: 'r2l' },
  { src: '198.51.100.100', dst: '196.188.1.1', sp: 43210, dp: 43, proto: 'TCP', dur: 0.1, bytes: 234, pkts: 2, anomalous: false, score: 0.25, label: 'normal' },
  { src: '209.17.96.50', dst: '196.188.1.10', sp: 52345, dp: 53, proto: 'UDP', dur: 0.01, bytes: 178, pkts: 1, anomalous: true, score: 0.52, label: 'probe' },
  { src: '10.0.1.47', dst: '10.0.1.50', sp: 49845, dp: 445, proto: 'TCP', dur: 0.5, bytes: 8900, pkts: 12, anomalous: true, score: 0.96, label: 'dos' },
  { src: '195.154.179.42', dst: '196.188.1.10', sp: 45678, dp: 21, proto: 'TCP', dur: 0.0, bytes: 0, pkts: 1, anomalous: true, score: 0.56, label: 'r2l' },
  { src: '10.0.1.72', dst: '185.100.87.41', sp: 51234, dp: 443, proto: 'TCP', dur: 1.7, bytes: 89000, pkts: 56, anomalous: true, score: 0.74, label: 'probe' },
  { src: '10.0.1.33', dst: '8.8.4.4', sp: 53890, dp: 53, proto: 'UDP', dur: 0.04, bytes: 2100, pkts: 2, anomalous: true, score: 0.59, label: 'probe' },
  { src: '91.234.99.12', dst: '10.0.1.40', sp: 80, dp: 51234, proto: 'TCP', dur: 45.2, bytes: 45670000, pkts: 32100, anomalous: true, score: 0.77, label: 'probe' },
  // ICMP
  { src: '10.0.1.52', dst: '8.8.8.8', sp: 0, dp: 0, proto: 'ICMP', dur: 0.05, bytes: 64, pkts: 1, anomalous: false, score: 0.02, label: 'normal' },
  { src: '10.0.1.15', dst: '10.0.1.1', sp: 0, dp: 0, proto: 'ICMP', dur: 0.02, bytes: 64, pkts: 1, anomalous: false, score: 0.03, label: 'normal' },
];

export const MOCK_FLOWS: NetworkFlow[] = FLOW_TEMPLATES.map((f, i) => ({
  id: `mock-flow-${String(i + 1).padStart(3, '0')}`,
  src_ip: f.src,
  dst_ip: f.dst,
  src_port: f.sp,
  dst_port: f.dp,
  protocol: f.proto,
  duration: f.dur,
  total_bytes: f.bytes,
  total_packets: f.pkts,
  src_bytes: Math.floor(f.bytes * 0.6),
  dst_bytes: Math.floor(f.bytes * 0.4),
  features: {},
  anomaly_score: f.score,
  is_anomaly: f.anomalous,
  ml_model: 'ensemble',
  label: f.label,
  source: 'live',
  created_at: ago(Math.floor(Math.random() * 120)),
  timestamp: ago(Math.floor(Math.random() * 120)),
}));

export const MOCK_FLOW_RESPONSE = {
  items: MOCK_FLOWS as unknown as FlowResponse[],
  total: 2847,
  page: 1,
  limit: 50,
};

// ══════════════════════════════════════════════════════════
// FLOW STATISTICS
// ══════════════════════════════════════════════════════════

export const MOCK_FLOW_STATS: FlowStatsResponse = {
  interval: '1h',
  total_flows: 2847,
  anomaly_count: 142,
  anomaly_percentage: 4.98,
  total_bytes: '12847562893',
  total_packets: 8234567,
  protocol_distribution: {
    TCP: { count: 1765, percentage: 62.0 },
    UDP: { count: 683, percentage: 24.0 },
    ICMP: { count: 228, percentage: 8.0 },
    Other: { count: 171, percentage: 6.0 },
  },
  top_source_ips: [
    { ip: '10.0.1.5', flow_count: 423, total_bytes: 5234000000 },
    { ip: '10.0.1.47', flow_count: 312, total_bytes: 2340000 },
    { ip: '103.45.67.89', flow_count: 287, total_bytes: 15600 },
    { ip: '10.0.1.15', flow_count: 198, total_bytes: 3456000000 },
    { ip: '91.134.200.55', flow_count: 156, total_bytes: 8900 },
  ],
  top_dest_ips: [
    { ip: '196.188.1.10', flow_count: 892, total_bytes: 7890000000 },
    { ip: '142.250.185.46', flow_count: 234, total_bytes: 234000000 },
    { ip: '10.0.1.1', flow_count: 178, total_bytes: 456000000 },
    { ip: '8.8.8.8', flow_count: 145, total_bytes: 89000000 },
    { ip: '157.240.1.35', flow_count: 112, total_bytes: 156000000 },
  ],
};

export const MOCK_TOP_TALKERS: TopTalker[] = [
  { ip: '10.0.1.5', bytes_total: 5234000000, flow_count: 423, is_anomalous: true },
  { ip: '196.188.1.10', bytes_total: 7890000000, flow_count: 892, is_anomalous: false },
  { ip: '10.0.1.47', bytes_total: 2340000, flow_count: 312, is_anomalous: true },
  { ip: '10.0.1.15', bytes_total: 3456000000, flow_count: 198, is_anomalous: true },
  { ip: '103.45.67.89', bytes_total: 15600, flow_count: 287, is_anomalous: true },
  { ip: '142.250.185.46', bytes_total: 234000000, flow_count: 234, is_anomalous: false },
  { ip: '10.0.1.52', bytes_total: 178000000, flow_count: 145, is_anomalous: false },
  { ip: '8.8.8.8', bytes_total: 89000000, flow_count: 112, is_anomalous: false },
  { ip: '91.134.200.55', bytes_total: 8900, flow_count: 156, is_anomalous: true },
  { ip: '10.0.1.72', bytes_total: 156000000, flow_count: 98, is_anomalous: false },
];

export const MOCK_PROTOCOLS: ProtocolStats[] = [
  { protocol: 'TCP', count: 1765, percent: 62.0 },
  { protocol: 'UDP', count: 683, percent: 24.0 },
  { protocol: 'ICMP', count: 228, percent: 8.0 },
  { protocol: 'Other', count: 171, percent: 6.0 },
];

// ══════════════════════════════════════════════════════════
// IOCs — 30 threat intelligence indicators
// ══════════════════════════════════════════════════════════

export const MOCK_IOCS: IOCResponse[] = [
  { id: 'ioc-1', ioc_type: 'ip', ioc_value: '103.45.67.89', source: 'otx', severity: 'critical', confidence: 0.95, tags: ['ddos', 'botnet', 'silver_fox'], created_at: ago(120) },
  { id: 'ioc-2', ioc_type: 'ip', ioc_value: '185.220.101.34', source: 'otx', severity: 'critical', confidence: 0.92, tags: ['c2', 'cobalt_strike'], created_at: ago(180) },
  { id: 'ioc-3', ioc_type: 'ip', ioc_value: '91.134.200.55', source: 'abuseipdb', severity: 'high', confidence: 0.88, tags: ['brute_force', 'ssh'], created_at: ago(240) },
  { id: 'ioc-4', ioc_type: 'domain', ioc_value: 'evil-c2.example.com', source: 'otx', severity: 'critical', confidence: 0.94, tags: ['c2', 'malware'], created_at: ago(300) },
  { id: 'ioc-5', ioc_type: 'hash', ioc_value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', source: 'virustotal', severity: 'critical', confidence: 0.98, tags: ['ransomware', 'wannacry'], created_at: ago(60) },
  { id: 'ioc-6', ioc_type: 'ip', ioc_value: '78.128.113.42', source: 'abuseipdb', severity: 'high', confidence: 0.85, tags: ['slowloris', 'ddos'], created_at: ago(150) },
  { id: 'ioc-7', ioc_type: 'ip', ioc_value: '89.40.182.15', source: 'abuseipdb', severity: 'high', confidence: 0.82, tags: ['rdp_brute_force'], created_at: ago(200) },
  { id: 'ioc-8', ioc_type: 'domain', ioc_value: 'phishing-cbe.et', source: 'otx', severity: 'high', confidence: 0.90, tags: ['phishing', 'ethiopia', 'banking'], created_at: ago(90) },
  { id: 'ioc-9', ioc_type: 'ip', ioc_value: '195.154.179.42', source: 'abuseipdb', severity: 'medium', confidence: 0.78, tags: ['ftp_brute_force'], created_at: ago(360) },
  { id: 'ioc-10', ioc_type: 'hash', ioc_value: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', source: 'virustotal', severity: 'critical', confidence: 0.97, tags: ['trojan', 'emotet'], created_at: ago(45) },
  { id: 'ioc-11', ioc_type: 'ip', ioc_value: '185.100.87.41', source: 'otx', severity: 'high', confidence: 0.87, tags: ['phishing', 'credential_theft'], created_at: ago(180) },
  { id: 'ioc-12', ioc_type: 'ip', ioc_value: '209.17.96.50', source: 'abuseipdb', severity: 'medium', confidence: 0.72, tags: ['dns_enumeration'], created_at: ago(400) },
  { id: 'ioc-13', ioc_type: 'url', ioc_value: 'http://malware-drop.evil.com/payload.exe', source: 'otx', severity: 'critical', confidence: 0.96, tags: ['malware', 'dropper'], created_at: ago(75) },
  { id: 'ioc-14', ioc_type: 'ip', ioc_value: '103.28.36.14', source: 'otx', severity: 'high', confidence: 0.89, tags: ['emotet', 'c2'], created_at: ago(120) },
  { id: 'ioc-15', ioc_type: 'domain', ioc_value: 'update-server.fake.com', source: 'virustotal', severity: 'high', confidence: 0.84, tags: ['supply_chain', 'trojan'], created_at: ago(150) },
  { id: 'ioc-16', ioc_type: 'ip', ioc_value: '91.234.99.12', source: 'abuseipdb', severity: 'high', confidence: 0.86, tags: ['supply_chain', 'malware_delivery'], created_at: ago(200) },
  { id: 'ioc-17', ioc_type: 'ip', ioc_value: '45.33.32.156', source: 'otx', severity: 'medium', confidence: 0.65, tags: ['scanner', 'nmap'], created_at: ago(500) },
  { id: 'ioc-18', ioc_type: 'hash', ioc_value: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8', source: 'virustotal', severity: 'critical', confidence: 0.99, tags: ['ransomware', 'lockbit'], created_at: ago(30) },
  { id: 'ioc-19', ioc_type: 'ip', ioc_value: '198.51.100.23', source: 'otx', severity: 'medium', confidence: 0.70, tags: ['powershell', 'dropper'], created_at: ago(300) },
  { id: 'ioc-20', ioc_type: 'domain', ioc_value: 'c2-backup.evil.net', source: 'otx', severity: 'critical', confidence: 0.93, tags: ['c2', 'backup'], created_at: ago(90) },
  { id: 'ioc-21', ioc_type: 'ip', ioc_value: '104.248.42.199', source: 'abuseipdb', severity: 'medium', confidence: 0.68, tags: ['cryptomining'], created_at: ago(240) },
  { id: 'ioc-22', ioc_type: 'ip', ioc_value: '175.24.232.83', source: 'abuseipdb', severity: 'critical', confidence: 0.91, tags: ['redis_hijack', 'compromised'], created_at: ago(1440) },
  { id: 'ioc-23', ioc_type: 'hash', ioc_value: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', source: 'virustotal', severity: 'high', confidence: 0.88, tags: ['trojan', 'rat'], created_at: ago(180) },
  { id: 'ioc-24', ioc_type: 'ip', ioc_value: '141.98.10.62', source: 'otx', severity: 'high', confidence: 0.85, tags: ['scanner', 'masscan'], created_at: ago(360) },
  { id: 'ioc-25', ioc_type: 'domain', ioc_value: 'login-cbe-secure.com', source: 'otx', severity: 'critical', confidence: 0.95, tags: ['phishing', 'ethiopia'], created_at: ago(60) },
  { id: 'ioc-26', ioc_type: 'ip', ioc_value: '5.188.206.14', source: 'abuseipdb', severity: 'high', confidence: 0.83, tags: ['ssh_brute_force'], created_at: ago(480) },
  { id: 'ioc-27', ioc_type: 'url', ioc_value: 'https://malware.evil.com/stage2.dll', source: 'virustotal', severity: 'critical', confidence: 0.97, tags: ['malware', 'dll_injection'], created_at: ago(45) },
  { id: 'ioc-28', ioc_type: 'ip', ioc_value: '23.129.64.210', source: 'otx', severity: 'low', confidence: 0.45, tags: ['tor_exit_node'], created_at: ago(720) },
  { id: 'ioc-29', ioc_type: 'hash', ioc_value: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0', source: 'virustotal', severity: 'high', confidence: 0.91, tags: ['cryptominer', 'xmrig'], created_at: ago(120) },
  { id: 'ioc-30', ioc_type: 'ip', ioc_value: '185.56.83.83', source: 'abuseipdb', severity: 'medium', confidence: 0.75, tags: ['proxy', 'vpn'], created_at: ago(600) },
];

// ══════════════════════════════════════════════════════════
// ML MODELS — 3 trained models with real metrics
// ══════════════════════════════════════════════════════════

export const MOCK_ML_MODELS: MLModelDetail[] = [
  {
    name: 'isolation_forest',
    trained: true,
    eval_results: {
      accuracy: 0.8254,
      precision: 0.9295,
      recall: 0.7502,
      f1_score: 0.8303,
      auc_roc: 0.9436,
      confusion_matrix: [
        [8987, 724],
        [3689, 9144],
      ],
    },
  },
  {
    name: 'random_forest',
    trained: true,
    eval_results: {
      accuracy: 0.7416,
      precision: 0.6400,
      recall: 0.9719,
      f1_score: 0.6945,
      auc_roc: 0.9576,
      confusion_matrix: [
        [9435, 276, 0, 0, 0],
        [173, 5767, 1254, 142, 2122],
        [36, 290, 1495, 18, 618],
        [0, 124, 17, 19, 593],
        [0, 10, 5, 1, 51],
      ],
    },
  },
  {
    name: 'autoencoder',
    trained: true,
    eval_results: {
      accuracy: 0.6217,
      precision: 0.8801,
      recall: 0.3884,
      f1_score: 0.5389,
      auc_roc: 0.8460,
      confusion_matrix: [
        [9542, 169],
        [8232, 4801],
      ],
    },
  },
];

export const MOCK_ML_COMPARISON: MLComparisonResponse = {
  models: [
    { model: 'isolation_forest', accuracy: 0.8254, f1_score: 0.8303, auc_roc: 0.9436 },
    { model: 'random_forest', accuracy: 0.7416, f1_score: 0.6945, auc_roc: 0.9576 },
    { model: 'autoencoder', accuracy: 0.6217, f1_score: 0.5389, auc_roc: 0.8460 },
    { model: 'ensemble', accuracy: 0.8073, f1_score: 0.8096, auc_roc: 0.9312 },
  ],
  best_accuracy: 'isolation_forest',
  best_f1: 'isolation_forest',
};

export const MOCK_CONFUSION_MATRIX: MLConfusionMatrixResponse = {
  model: 'random_forest',
  confusion_matrix: [
    [9435, 276, 0, 0, 0],
    [173, 5767, 1254, 142, 2122],
    [36, 290, 1495, 18, 618],
    [0, 124, 17, 19, 593],
    [0, 10, 5, 1, 51],
  ],
  class_names: ['dos', 'normal', 'probe', 'r2l', 'u2r'],
  n_samples: 22544,
};

// ══════════════════════════════════════════════════════════
// PCAP UPLOADS
// ══════════════════════════════════════════════════════════

export const MOCK_PCAP_UPLOADS: PCAPUploadResponse[] = [
  { id: 'pcap-1', filename: 'port_scan_apr10.pcap', file_size: 2456789, status: 'completed', packets_count: 15234, flows_extracted: 1024, anomalies_found: 127, created_at: ago(2880) },
  { id: 'pcap-2', filename: 'ddos_simulation.pcap', file_size: 8901234, status: 'completed', packets_count: 48291, flows_extracted: 3456, anomalies_found: 564, created_at: ago(1440) },
  { id: 'pcap-3', filename: 'suspicious_traffic.pcap', file_size: 1234567, status: 'processing', created_at: ago(30) },
];

// ══════════════════════════════════════════════════════════
// SYSTEM HEALTH
// ══════════════════════════════════════════════════════════

export const MOCK_SYSTEM_HEALTH: SystemHealth = {
  status: 'healthy',
  version: 'v1.0.0',
  uptime: 432000,
  services: {
    database: { status: 'healthy', latency_ms: 2.3, last_check: ago(0) },
    redis: { status: 'healthy', latency_ms: 0.8, last_check: ago(0) },
    capture: { status: 'healthy', latency_ms: 0, last_check: ago(0) },
    ml_worker: { status: 'healthy', latency_ms: 0, last_check: ago(0) },
    llm_gateway: { status: 'healthy', latency_ms: 0, last_check: ago(0) },
  },
  metrics: {
    cpu_percent: 23.4,
    memory_percent: 45.7,
    disk_percent: 31.2,
    active_connections: 1247,
  },
  timestamp: ago(0),
};

// ══════════════════════════════════════════════════════════
// ALERT STATS (for /alerts/stats endpoint)
// ══════════════════════════════════════════════════════════

export const MOCK_ALERT_STATS = {
  total_alerts: 5748,
  open_count: 2341,
  acknowledged_count: 1567,
  investigating_count: 892,
  resolved_count: 748,
  false_positive_count: 200,
  severity_distribution: { critical: 1584, high: 1228, medium: 2936, low: 0, info: 0 },
  category_distribution: { ddos: 2140, port_scan: 1256, dns_tunnel: 480, brute_force: 892, c2: 340, data_exfiltration: 180, malware: 260, phishing: 200 },
};

// ══════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════

export const MOCK_REPORTS = {
  reports: [
    { id: 'rpt-1', report_type: 'daily_summary', title: 'Daily Threat Summary — April 29, 2026', status: 'complete', generated_at: ago(120), format: 'pdf' },
    { id: 'rpt-2', report_type: 'incident', title: 'Incident Report — DDoS Attack TM-20260429', status: 'complete', generated_at: ago(360), format: 'pdf' },
    { id: 'rpt-3', report_type: 'executive', title: 'Executive Briefing — Week 8', status: 'complete', generated_at: ago(1440), format: 'pdf' },
    { id: 'rpt-4', report_type: 'ml_performance', title: 'ML Model Performance Report v1.0', status: 'complete', generated_at: ago(2880), format: 'json' },
  ],
  total: 4,
  limit: 20,
  offset: 0,
};

// ══════════════════════════════════════════════════════════
// ADMIN — Audit Log
// ══════════════════════════════════════════════════════════

export const MOCK_AUDIT_LOG = {
  entries: [
    { id: 'audit-1', user_id: null, action: 'login', entity_type: 'user', entity_id: 'usr-001', details: { email: 'admin@threatmatrix.ai' }, ip_address: '196.188.1.50', created_at: ago(5) },
    { id: 'audit-2', user_id: null, action: 'report_generated', entity_type: 'report', entity_id: 'rpt-1', details: { format: 'pdf', report_type: 'daily_summary' }, ip_address: '196.188.1.50', created_at: ago(120) },
    { id: 'audit-3', user_id: null, action: 'alert_status_change', entity_type: 'alert', entity_id: 'alert-005', details: { from: 'open', to: 'investigating' }, ip_address: '196.188.1.50', created_at: ago(180) },
    { id: 'audit-4', user_id: null, action: 'model_retrain', entity_type: 'model', entity_id: 'isolation_forest_v1', details: { dataset: 'nsl_kdd', models: ['isolation_forest'] }, ip_address: '196.188.1.50', created_at: ago(2880) },
    { id: 'audit-5', user_id: null, action: 'ioc_sync', entity_type: 'threat_intel', entity_id: null, details: { synced_pulses: 50, iocs_inserted: 1367 }, ip_address: '196.188.1.50', created_at: ago(4320) },
    { id: 'audit-6', user_id: null, action: 'login', entity_type: 'user', entity_id: 'usr-002', details: { email: 'analyst@threatmatrix.ai' }, ip_address: '196.188.1.51', created_at: ago(30) },
    { id: 'audit-7', user_id: null, action: 'alert_status_change', entity_type: 'alert', entity_id: 'alert-012', details: { from: 'investigating', to: 'resolved' }, ip_address: '196.188.1.51', created_at: ago(60) },
    { id: 'audit-8', user_id: null, action: 'report_generated', entity_type: 'report', entity_id: 'rpt-3', details: { format: 'pdf', report_type: 'executive' }, ip_address: '196.188.1.50', created_at: ago(1440) },
  ],
  total: 8,
  limit: 50,
  offset: 0,
};

// ══════════════════════════════════════════════════════════
// LLM BUDGET
// ══════════════════════════════════════════════════════════

export const MOCK_LLM_BUDGET = {
  enabled: true,
  provider: 'openrouter',
  credits_loaded: 20.0,
  stats: {
    requests: 142,
    tokens_in: 234567,
    tokens_out: 189234,
    errors: 3,
    cost_usd: 0.0,
    by_model: {
      'nvidia/nemotron-3-super-120b-a12b:free': 45,
      'openai/gpt-oss-120b:free': 62,
      'stepfun/step-3.5-flash:free': 35,
    },
  },
  models_available: [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-120b:free',
    'stepfun/step-3.5-flash:free',
  ],
  persistent: true,
};

// ══════════════════════════════════════════════════════════
// GEO FLOWS (for ThreatMap)
// ══════════════════════════════════════════════════════════

export const MOCK_GEO_FLOWS = [
  { src_lat: 9.02, src_lon: 38.75, dst_lat: 9.03, dst_lon: 38.76, src_ip: '10.0.1.47', dst_ip: '196.188.1.10', anomaly_score: 0.87, is_anomaly: true, label: 'c2', bytes: 8420 },
  { src_lat: 51.5, src_lon: -0.12, dst_lat: 9.02, dst_lon: 38.75, src_ip: '185.220.101.34', dst_ip: '10.0.1.47', anomaly_score: 0.85, is_anomaly: true, label: 'c2', bytes: 3210 },
  { src_lat: 39.9, src_lon: 116.4, dst_lat: 9.02, dst_lon: 38.75, src_ip: '103.45.67.89', dst_ip: '196.188.1.10', anomaly_score: 0.94, is_anomaly: true, label: 'ddos', bytes: 15600 },
  { src_lat: 48.8, src_lon: 2.35, dst_lat: 9.02, dst_lon: 38.75, src_ip: '91.134.200.55', dst_ip: '196.188.1.10', anomaly_score: 0.82, is_anomaly: true, label: 'brute_force', bytes: 8900 },
  { src_lat: 40.7, src_lon: -74.0, dst_lat: 9.02, dst_lon: 38.75, src_ip: '8.8.8.8', dst_ip: '10.0.1.23', anomaly_score: 0.12, is_anomaly: false, label: 'dns', bytes: 312 },
  { src_lat: 52.5, src_lon: 13.4, dst_lat: 9.02, dst_lon: 38.75, src_ip: '187.124.45.161', dst_ip: '196.188.1.10', anomaly_score: 0.78, is_anomaly: true, label: 'scan', bytes: 44 },
  { src_lat: 44.4, src_lon: 26.1, dst_lat: 9.02, dst_lon: 38.75, src_ip: '89.40.182.15', dst_ip: '196.188.1.10', anomaly_score: 0.57, is_anomaly: true, label: 'brute_force', bytes: 234 },
  { src_lat: 50.4, src_lon: 30.5, dst_lat: 9.02, dst_lon: 38.75, src_ip: '78.128.113.42', dst_ip: '196.188.1.10', anomaly_score: 0.55, is_anomaly: true, label: 'slowloris', bytes: 234 },
  { src_lat: 37.4, src_lon: -122.1, dst_lat: 9.02, dst_lon: 38.75, src_ip: '142.250.185.46', dst_ip: '10.0.1.52', anomaly_score: 0.05, is_anomaly: false, label: 'normal', bytes: 128000 },
  { src_lat: 35.7, src_lon: 139.7, dst_lat: 9.02, dst_lon: 38.75, src_ip: '34.120.195.249', dst_ip: '10.0.1.40', anomaly_score: 0.09, is_anomaly: false, label: 'normal', bytes: 567000 },
  { src_lat: 41.0, src_lon: 29.0, dst_lat: 9.02, dst_lon: 38.75, src_ip: '195.154.179.42', dst_ip: '196.188.1.10', anomaly_score: 0.56, is_anomaly: true, label: 'ftp_brute', bytes: 67000 },
  { src_lat: 47.4, src_lon: 8.5, dst_lat: 9.02, dst_lon: 38.75, src_ip: '104.248.42.199', dst_ip: '10.0.1.91', anomaly_score: 0.61, is_anomaly: true, label: 'cryptojacking', bytes: 1245000 },
  { src_lat: 55.7, src_lon: 37.6, dst_lat: 9.02, dst_lon: 38.75, src_ip: '185.56.83.83', dst_ip: '196.188.1.10', anomaly_score: 0.35, is_anomaly: false, label: 'vpn', bytes: 45000 },
  { src_lat: 46.2, src_lon: 6.1, dst_lat: 9.02, dst_lon: 38.75, src_ip: '185.100.87.41', dst_ip: '10.0.1.72', anomaly_score: 0.74, is_anomaly: true, label: 'phishing', bytes: 89000 },
  { src_lat: 38.9, src_lon: -77.0, dst_lat: 9.02, dst_lon: 38.75, src_ip: '209.17.96.50', dst_ip: '196.188.1.10', anomaly_score: 0.52, is_anomaly: true, label: 'dns_enum', bytes: 178 },
];

// ══════════════════════════════════════════════════════════
// TIMELINE DATA (60 minutes of traffic)
// ══════════════════════════════════════════════════════════

export const MOCK_TIMELINE_DATA = Array.from({ length: 60 }, (_, i) => {
  const base = 50 + Math.sin(i / 5) * 20;
  const spike = (i > 40 && i < 45) ? 150 : (i > 20 && i < 23) ? 80 : 0;
  return {
    timestamp: new Date(Date.now() - (59 - i) * 60_000).toISOString(),
    packets_per_second: Math.round(base + spike + Math.random() * 15),
    bytes_per_second: Math.round((base + spike) * 1420 + Math.random() * 50000),
    active_flows: Math.round(25 + Math.random() * 15 + (spike > 0 ? 200 : 0)),
    anomaly_count: spike > 0 ? Math.round(spike / 10) : Math.round(Math.random() * 2),
  };
});

// ══════════════════════════════════════════════════════════
// MOCK API RESPONSE ROUTER
// Maps URL patterns to mock data
// ══════════════════════════════════════════════════════════

export function getMockResponse<T>(path: string, method: string): T | null {
  // Alerts
  if (path.startsWith('/api/v1/alerts/') && path.includes('/status') && method === 'PATCH') {
    return { success: true } as T;
  }
  if (path.startsWith('/api/v1/alerts/') && path.includes('/assign') && method === 'PATCH') {
    return { success: true } as T;
  }
  if (path.startsWith('/api/v1/alerts/stats')) {
    return MOCK_ALERT_STATS as T;
  }
  if (path.match(/\/api\/v1\/alerts\/TM-/) && method === 'GET') {
    const alert = MOCK_ALERTS[0];
    return alert as T;
  }
  if (path.startsWith('/api/v1/alerts') && method === 'GET') {
    return { items: MOCK_ALERTS, total: MOCK_ALERTS.length } as T;
  }

  // Flows
  if (path.startsWith('/api/v1/flows/stats')) {
    return MOCK_FLOW_STATS as T;
  }
  if (path.startsWith('/api/v1/flows/top-talkers')) {
    return { top_talkers: MOCK_TOP_TALKERS.map(t => ({ ip: t.ip, flow_count: t.flow_count, total_bytes: t.bytes_total, total_packets: 0, anomaly_count: t.is_anomalous ? 1 : 0 })), period: '1h', total_talkers: 10 } as T;
  }
  if (path.startsWith('/api/v1/flows/protocols')) {
    return { protocols: { TCP: { count: 1765, percentage: 62 }, UDP: { count: 683, percentage: 24 }, ICMP: { count: 228, percentage: 8 }, Other: { count: 171, percentage: 6 } }, total_flows: 2847, period: '1h' } as T;
  }
  if (path.startsWith('/api/v1/flows/search')) {
    return MOCK_FLOW_RESPONSE as T;
  }
  if (path.startsWith('/api/v1/flows') && method === 'GET') {
    return MOCK_FLOW_RESPONSE as T;
  }

  // ML
  if (path.startsWith('/api/v1/ml/comparison')) {
    return MOCK_ML_COMPARISON as T;
  }
  if (path.includes('/confusion-matrix')) {
    return MOCK_CONFUSION_MATRIX as T;
  }
  if (path.startsWith('/api/v1/ml/training-history')) {
    return { history: MOCK_ML_MODELS.map(m => ({ name: m.name, model_type: m.name, version: '1.0', status: 'active', dataset: 'nsl_kdd', metrics: m.eval_results, hyperparams: {}, is_active: true, trained_at: ago(2880), created_at: ago(2880) })), total: 3 } as T;
  }
  if (path.startsWith('/api/v1/ml/models') && method === 'GET') {
    return { models: MOCK_ML_MODELS } as T;
  }
  if (path.startsWith('/api/v1/ml/worker/status')) {
    return { status: 'active', flows_scored: 1650000, anomalies_detected: 3247, alerts_created: 5748, avg_inference_ms: 165 } as T;
  }

  // Intel
  if (path.startsWith('/api/v1/intel/iocs')) {
    return { items: MOCK_IOCS, total: MOCK_IOCS.length } as T;
  }
  if (path.startsWith('/api/v1/intel/feeds/status')) {
    return { otx_enabled: true, abuseipdb_enabled: true, virustotal_enabled: true, stats: { lookups: 234, iocs_found: 1367 } } as T;
  }
  if (path.startsWith('/api/v1/intel/lookup')) {
    return { ip: '8.8.8.8', combined_threat_score: 0, risk_level: 'clean', otx: { pulse_count: 0 }, abuseipdb: { abuse_confidence: 0 } } as T;
  }

  // Capture / Forensics
  if (path.startsWith('/api/v1/capture/status')) {
    return { status: 'running', interface: 'eth0', packets_captured: 23456789, flows_completed: 1650000, flows_published: 1650000, uptime: 432000 } as T;
  }
  if (path.startsWith('/api/v1/capture/uploads') || path.startsWith('/api/v1/pcap/uploads')) {
    return MOCK_PCAP_UPLOADS as T;
  }

  // Reports
  if (path.startsWith('/api/v1/reports') && method === 'GET') {
    return MOCK_REPORTS as T;
  }
  if (path.startsWith('/api/v1/reports/generate') && method === 'POST') {
    return { id: `rpt-${Date.now()}`, report_type: 'daily_summary', title: 'Generated Report', status: 'complete', data: MOCK_ALERT_STATS, generated_at: ago(0) } as T;
  }

  // LLM
  if (path.startsWith('/api/v1/llm/budget')) {
    return MOCK_LLM_BUDGET as T;
  }

  // System
  if (path.startsWith('/api/v1/system/health')) {
    return MOCK_SYSTEM_HEALTH as T;
  }
  if (path.startsWith('/api/v1/system/config')) {
    return { capture: { engine: 'scapy', features_per_flow: 63, interface: 'eth0' }, ml: { ensemble_weights: { isolation_forest: 0.30, random_forest: 0.45, autoencoder: 0.25 }, alert_thresholds: { critical: 0.90, high: 0.75, medium: 0.50, low: 0.30 } }, system: { version: 'v1.0.0', environment: 'production' } } as T;
  }

  // Admin
  if (path.startsWith('/api/v1/admin/audit-log')) {
    return MOCK_AUDIT_LOG as T;
  }

  // Auth (for login)
  if (path.startsWith('/api/v1/auth/login') && method === 'POST') {
    return { access_token: 'demo_token', refresh_token: 'demo_refresh', token_type: 'bearer', expires_in: 900 } as T;
  }
  if (path.startsWith('/api/v1/auth/me')) {
    return { id: 'usr-001', email: 'admin@threatmatrix.ai', full_name: 'Demo Admin', role: 'admin', language: 'en', is_active: true, created_at: ago(10000) } as T;
  }

  return null;
}
