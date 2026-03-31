# Day 19 Plan: Attack Simulation, PCAP Demo Scenarios & E2E Walkthrough

> **Date:** April 1, 2026 (Week 6, Day 2)
> **Version:** v0.6.0 (1 week ahead of schedule)
> **Priority:** 🔴 CRITICAL — Demo preparation is the critical path to presentation success

---

## Context

Day 18 completed the full frontend overhaul (10/10 pages connected to VPS, 36 endpoints verified). A comprehensive project audit identified the **#1 gap**: no attack simulation scripts or PCAP demo scenarios exist for demo day. Per MASTER_DOC_PART5 §7.3 (Demo Scenario Test Cases) and §8.1 (Demo Script), the system must demonstrate live anomaly detection with visible alert generation.

**Current Infrastructure:**
- VPS at `187.124.45.161:8000` — all 5 Docker containers running
- Capture engine active on VPS (Scapy sniffing on host network)
- ML Worker scoring flows in real-time (105K+ flows scored)
- Alert Engine with IOC correlation + LLM auto-narrative
- PCAP processor ready (POST /capture/upload-pcap)
- Frontend connected to VPS (`.env.local` points to `187.124.45.161:8000`)

---

## Task 1: Attack Simulation Scripts 🔴

**Reference:** MASTER_DOC_PART5 §7.3 Demo Scenario Test Cases

### Approach

Create a `scripts/attack_simulation/` directory with executable scripts that generate real network traffic against the VPS. The capture engine on the VPS will detect this traffic, the ML Worker will score it, and alerts should fire.

**Key Design Decision:** Scripts are committed to the repo and executed directly on the VPS (Linux environment). The VPS has nmap, hping3, hydra, and Scapy available. Attack traffic targets localhost/127.0.0.1 or the VPS's own interface, which the capture engine observes via host network mode.

### Files to Create

```
scripts/attack_simulation/
├── README.md                    # Usage guide, prerequisites, expected outcomes
├── run_all.sh                   # Master script that runs all scenarios sequentially
├── 01_port_scan.sh              # nmap SYN scan
├── 02_ddos_simulation.sh        # hping3 SYN flood
├── 03_dns_tunnel.sh             # Python script for DNS tunneling patterns
├── 04_brute_force.sh            # hydra SSH brute force
└── 05_normal_traffic.sh         # Normal browsing/API call baseline
```

### Script Specifications

#### `01_port_scan.sh` — Port Scan Detection
- **Tool:** `nmap -sS -p 1-1000 127.0.0.1` (SYN scan on localhost, common ports)
- **Alt:** `nmap -sS -p 1-1000 <VPS_PUBLIC_IP>` (external scan from VPS to itself)
- **Expected Detection:** Probe/scan classification by Random Forest
- **Expected Alert Severity:** HIGH (confidence ≥0.75)
- **Verification:** Check `/alerts/` for new alert with category `port_scan`

#### `02_ddos_simulation.sh` — DDoS Simulation
- **Tool:** `hping3 -S --flood -p 80 127.0.0.1` (SYN flood on port 80, 10-second burst)
- **Expected Detection:** Volume anomaly, DDoS classification
- **Expected Alert Severity:** CRITICAL (confidence ≥0.90)
- **Note:** Use `--flood` for maximum speed, limit to 10 seconds to avoid actual disruption
- **Verification:** Check `/alerts/` for new alert with category `ddos`

#### `03_dns_tunnel.sh` — DNS Tunneling
- **Approach:** Python script using `scapy` or `dnslib` to send high-entropy DNS queries
- **Pattern:** Send DNS queries with long, random subdomains (high entropy payload)
- **Expected Detection:** Unusual DNS pattern, high entropy payload
- **Expected Alert Severity:** MEDIUM
- **Verification:** Check `/alerts/` for DNS-related anomaly

#### `04_brute_force.sh` — SSH Brute Force
- **Tool:** `hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://127.0.0.1 -t 4 -vV`
- **Alternative:** Simple bash loop with `sshpass` attempting 20 failed logins against localhost
- **Expected Detection:** Failed login volume spike, R2L classification
- **Expected Alert Severity:** HIGH
- **Verification:** Check `/alerts/` for brute force / unauthorized access alert

#### `05_normal_traffic.sh` — Normal Baseline
- **Approach:** `curl` requests to VPS API endpoints, normal HTTP browsing
- **Expected Detection:** No alerts (false positive check)
- **Verification:** Confirm no new alerts generated during normal traffic

### Verification Steps (Per Script)
1. Record alert count before attack: `curl http://localhost:8000/api/v1/alerts/stats`
2. Run attack script
3. Wait 30-60 seconds for ML scoring + alert creation
4. Check alert count after: compare delta
5. Verify alert severity, category, and LLM narrative quality
6. Check WebSocket broadcast (open War Room, confirm alert appears live)

---

## Task 2: PCAP Demo Scenario Files 🔴

**Reference:** MASTER_DOC_PART5 §8.2 Backup Plans — "Pre-loaded PCAP with interesting anomalies"

### Approach

Create a Python script (`scripts/generate_demo_pcaps.py`) that uses Scapy to craft synthetic PCAP files representing distinct attack patterns. These serve as **backup demo assets** if live traffic demo fails.

### Files to Create

```
pcaps/demo/                          # New directory (matches docker-compose volume mount)
├── README.md                        # Description of each scenario
├── ddos_scenario.pcap               # SYN flood pattern
├── port_scan.pcap                   # nmap-style scan pattern
├── dns_tunnel.pcap                  # DNS exfiltration pattern
├── brute_force.pcap                 # Repeated SSH connection attempts
└── normal_traffic.pcap              # Clean baseline traffic

scripts/generate_demo_pcaps.py       # Scapy-based PCAP generator
```

### PCAP Specifications

#### `ddos_scenario.pcap`
- **Content:** 500+ SYN packets from 20+ source IPs to port 80 on a single destination
- **Craft:** Scapy `IP(src=fake_ips)/TCP(dport=80, flags='S')`
- **Purpose:** Show CRITICAL alert generation when uploaded

#### `port_scan.pcap`
- **Content:** Sequential SYN packets from one IP to 100+ different ports on destination
- **Craft:** Scapy `IP()/TCP(dport=port_range, flags='S')`
- **Purpose:** Show probe detection, port sweep classification

#### `dns_tunnel.pcap`
- **Content:** DNS queries with high-entropy subdomains (base64-encoded data in subdomain)
- **Craft:** Scapy `IP()/UDP()/DNS(qd=DNSQR(qname=high_entropy_domain))`
- **Purpose:** Show entropy-based detection

#### `brute_force.pcap`
- **Content:** 50+ TCP SYN packets to port 22 from same source IP (simulating repeated SSH attempts)
- **Craft:** Scapy `IP()/TCP(dport=22, flags='S')`
- **Purpose:** Show R2L classification, brute force detection

#### `normal_traffic.pcap`
- **Content:** HTTP GET requests, DNS lookups, normal bidirectional traffic
- **Craft:** Scapy `IP()/TCP(dport=80, flags='PA')/Raw(load='GET / HTTP/1.1...')`
- **Purpose:** Show false-positive rate (should produce no alerts)

### Upload & Verification

Each PCAP is uploaded via:
```bash
curl -X POST http://localhost:8000/api/v1/capture/upload-pcap \
  -H "Authorization: Bearer <token>" \
  -F "file=@pcaps/demo/ddos_scenario.pcap"
```

Verification:
1. Upload returns `{status: "processing", task_id: "..."}`
2. Wait for processing (check `/capture/status`)
3. Check `/flows/` for new flows with `source='pcap'`
4. Check `/alerts/` for new alerts from PCAP analysis
5. Verify anomaly scores are correctly assigned

---

## Task 3: E2E Real Traffic Walkthrough 🔴

**Reference:** MASTER_DOC_PART5 §8.1 Demo Script (5:30-10:30 mark)

### Walkthrough Steps

Execute the demo script flow end-to-end and document results:

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open War Room (`/war-room`) | Live data flowing, map active, metrics updating | |
| 2 | Run nmap port scan against VPS | Alert fires within 60 seconds | |
| 3 | Open Alert Console (`/alerts`) | New alert visible with severity, category, timestamp | |
| 4 | Click alert detail | AI narrative displayed, related flows listed | |
| 5 | Open AI Analyst (`/ai-analyst`) | Ask "Explain the latest alert" — coherent response | |
| 6 | Open ML Ops (`/ml-ops`) | Model metrics, confusion matrix, comparison table display | |
| 7 | Open Reports (`/reports`) | Generate threat summary → PDF downloads | |
| 8 | Open Intel Hub (`/intel`) | IOC browser shows data, IP lookup works | |
| 9 | Open Admin (`/admin`) | Audit log shows recent events, system health green | |
| 10 | Check War Room live feed | Attack alert visible in scrolling feed | |

### Deliverable
- Written walkthrough results in `docs/worklog/DAY_19_APR01.md` with pass/fail for each step
- Screenshots of key moments (alert firing, AI narrative, ML metrics)

---

## Task 4: LLM Narrative Quality Check 🟡

### Approach
- Trigger 3-5 alerts (via attack scripts or PCAP uploads)
- Fetch each alert's `ai_narrative` field via `GET /alerts/{id}`
- Evaluate against quality criteria:

| Criterion | Check |
|-----------|-------|
| Explains what happened | Clear description of the attack/anomaly |
| States why it's dangerous | Risk/impact assessment provided |
| Recommends actions | Specific remediation steps given |
| No hallucinations | Technical details are accurate |
| Professional tone | Suitable for demo presentation |

### If Quality is Poor
- Adjust prompt templates in `backend/app/services/llm_gateway.py`
- Consider switching primary model for alert analysis
- Check OpenRouter model availability

---

## Task 5: Auth Enable + Demo Accounts 🟡

**Reference:** MASTER_DOC_PART5 §8.3 Pre-Demo Checklist

### Steps
1. Verify current auth state on VPS (DEV_MODE status)
2. Create demo accounts via `POST /auth/register`:
   - `admin@threatmatrix.ai` (admin role) — password: `Demo2026!`
   - `analyst@threatmatrix.ai` (analyst role) — password: `Demo2026!`
   - `viewer@threatmatrix.ai` (viewer role) — password: `Demo2026!`
3. Test login flow in frontend with each account
4. Verify RBAC enforcement:
   - Viewer cannot retrain models or access admin
   - Analyst can analyze but cannot manage users
   - Admin has full access

### Note
Can revert to `DEV_MODE=true` after verification for continued development.

---

## Task 6: VPS System Health Verification 🟢

### Health Checks

| Check | Command | Expected |
|-------|---------|----------|
| All containers running | `docker-compose ps` | 5/5 up |
| Postgres health | `pg_isready -U threatmatrix` | OK |
| Redis health | `redis-cli ping` | PONG |
| Disk space | `df -h` | < 80% used |
| Memory usage | `free -h` | < 80% used |
| ML models loaded | `curl /api/v1/ml/models` | 3 models listed |
| Capture active | `curl /api/v1/capture/status` | Running |
| Flow count | `curl /api/v1/flows/stats` | Count > 105,000 |
| LLM responding | `curl /api/v1/llm/budget` | 200 OK |

---

## Implementation Order

1. **Task 6** — VPS Health Verification (5 min, quick sanity check)
2. **Task 2** — Generate PCAP demo files (local, no VPS dependency)
3. **Task 1** — Create attack simulation scripts
4. **Task 5** — Create demo accounts
5. **Task 1 + 2 execution** — Run attacks, upload PCAPs, verify alerts
6. **Task 3** — E2E walkthrough documentation
7. **Task 4** — LLM narrative quality review

---

## Success Criteria

- [ ] ≥3 attack types produce visible alerts in the frontend
- [ ] LLM narratives are generated and coherent for each alert
- [ ] At least 3 PCAP demo files created and verified via upload
- [ ] E2E walkthrough documented with pass/fail for each step
- [ ] Demo accounts created (can defer if auth flow has issues)
- [ ] VPS infrastructure verified healthy

---

## Architectural Compliance

All Day 19 tasks are **within MASTER_DOC_PART5 §7-8 scope** (Testing Strategy + Demo Day Preparation). No new modules, features, or technologies are being introduced. This is pure verification and demo readiness work.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Attack tools not installed locally | Document install instructions in README; PCAP fallback available |
| VPS doesn't detect attacks (capture on wrong interface) | Check `CAPTURE_INTERFACE` config; use PCAP upload as fallback |
| LLM narratives are poor quality | Adjust prompts; pre-cache good responses for demo |
| Attack traffic on localhost may not trigger capture | Capture engine runs in `network_mode: host` — may need to target public IP or set `CAPTURE_INTERFACE=lo` for localhost attacks. Test both approaches. |
