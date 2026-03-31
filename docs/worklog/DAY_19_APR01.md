# Day 19 — April 1, 2026 (Week 6, Day 2)

## Real Traffic Testing, Attack Simulation & Demo Preparation

---

## 📋 PLANNED TASKS

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Attack Simulation Scripts (nmap, hping3, hydra) | 🔴 | 🔲 PENDING |
| 2 | PCAP Demo Scenario Files (3-5 attack types) | 🔴 | 🔲 PENDING |
| 3 | E2E Real Traffic Walkthrough | 🔴 | 🔲 PENDING |
| 4 | LLM Narrative Quality Verification | 🟡 | 🔲 PENDING |
| 5 | Auth Enable + Demo Account Creation | 🟡 | 🔲 PENDING |
| 6 | VPS System Health Verification | 🟢 | 🔲 PENDING |

---

## Context & Rationale

Day 18 completed the full frontend overhaul with all 10 pages connected to the VPS backend. A comprehensive project audit (9 dimensions) identified the **#1 gap**: no attack simulation scripts or PCAP demo scenarios exist for demo day presentations. Per MASTER_DOC_PART5 §7.3 (Demo Scenario Test Cases) and §8.1 (Demo Script), the system must demonstrate live anomaly detection with visible alert generation.

**v0.6.0 is achieved** — 1 week ahead of schedule. This buffer should be used for demo readiness, which is the critical path to a successful presentation.

---

## Task 1: Attack Simulation Scripts 🔴

**Reference:** PART5 §7.3 Demo Scenario Test Cases

Create executable scripts for the following attack scenarios against the VPS:

| Scenario | Tool | Expected Detection | Alert Severity |
|----------|------|--------------------|----------------|
| **Port Scan** | `nmap -sS target_ip` | Probe detected, port sweep classification | HIGH |
| **DDoS Simulation** | `hping3 --flood target_ip` | Volume anomaly, DDoS classification | CRITICAL |
| **DNS Tunneling** | Crafted DNS queries | Unusual DNS pattern, high entropy | MEDIUM |
| **Brute Force SSH** | `hydra -l root -P wordlist ssh://target` | Failed login volume spike | HIGH |
| **Normal Traffic** | Regular browsing, API calls | No false alerts | — |

**Deliverable:** `scripts/attack_simulation/` directory with documented scripts and expected outcomes.

**Verification:**
- [ ] Each attack produces ≥1 alert in the alerts table
- [ ] Alerts have correct severity classification
- [ ] LLM auto-narrative fires for each alert
- [ ] WebSocket broadcasts alert to connected frontend

---

## Task 2: PCAP Demo Scenario Files 🔴

**Reference:** PART5 §8.2 Backup Plans — "Pre-loaded PCAP with interesting anomalies"

Create or obtain PCAP files representing distinct attack patterns for offline demo backup:

| PCAP File | Content | Purpose |
|-----------|---------|---------|
| `ddos_scenario.pcap` | SYN flood / volumetric attack | Show CRITICAL alert generation |
| `port_scan.pcap` | nmap scan results | Show probe detection |
| `dns_tunnel.pcap` | DNS exfiltration pattern | Show entropy-based detection |
| `brute_force.pcap` | Repeated SSH/FTP attempts | Show R2L classification |
| `normal_traffic.pcap` | Clean traffic baseline | Show false-positive rate |

**Deliverable:** `pcaps/demo/` directory with 3-5 PCAP files + README explaining each scenario.

**Verification:**
- [ ] Each PCAP uploads successfully via POST /capture/upload-pcap
- [ ] PCAP processor extracts flows and scores them
- [ ] Attack PCAPs produce alerts; normal PCAP produces none

---

## Task 3: E2E Real Traffic Walkthrough 🔴

**Reference:** PART5 §8.1 Demo Script (5:30-10:30 mark)

Execute the demo script flow end-to-end:

1. Open War Room — verify live data flowing
2. Run nmap attack → verify alert fires within 60 seconds
3. Open Alert Console → verify alert detail with AI narrative
4. Open AI Analyst → ask about the attack → verify coherent response
5. Open ML Ops → verify model metrics display correctly
6. Open Reports → generate threat summary → download PDF
7. Open Intel Hub → verify IOC correlation data
8. Open Admin → verify audit log shows events

**Deliverable:** Written walkthrough results with pass/fail for each step.

**Verification:**
- [ ] Alert appears in War Room live feed within 60s of attack
- [ ] AI Analyst can explain the detected threat
- [ ] PDF report generates with correct data
- [ ] Total E2E latency (attack → alert visible) < 200ms target (PART4 §8.2)

---

## Task 4: LLM Narrative Quality Check 🟡

Review the AI-generated narratives for recent alerts and verify:

- [ ] Narratives explain what happened clearly
- [ ] Why the activity is dangerous is stated
- [ ] Recommended actions are provided
- [ ] No hallucinations or incorrect technical details
- [ ] Language is professional and suitable for demo

If quality is poor, adjust prompt templates (PART4 §9.2) or switch to a better OpenRouter model.

---

## Task 5: Auth Enable + Demo Accounts 🟡

**Reference:** PART5 §8.3 Pre-Demo Checklist — "Demo user account created (analyst role)"

1. Set `DEV_MODE=false` temporarily on VPS
2. Create demo accounts via auth endpoints:
   - `admin@threatmatrix.ai` (admin role)
   - `analyst@threatmatrix.ai` (analyst role)
   - `viewer@threatmatrix.ai` (viewer role)
3. Test login flow in frontend with each account
4. Verify RBAC enforcement (viewer can't retrain, analyst can analyze but not admin)

**Note:** Can revert to `DEV_MODE=true` after verification for continued development.

---

## Task 6: VPS System Health Verification 🟢

Full infrastructure check:

| Check | Command | Expected |
|-------|---------|----------|
| All containers running | `docker-compose ps` | 5/5 up |
| Postgres health | `pg_isready -U threatmatrix` | OK |
| Redis health | `redis-cli ping` | PONG |
| Disk space | `df -h` | < 80% used |
| Memory usage | `free -h` | < 80% used |
| ML models loaded | `curl /api/v1/ml/models` | 3 models |
| Capture active | `curl /api/v1/capture/status` | Running |
| Flow count growing | `curl /api/v1/flows/stats` | Count > 105,000 |
| LLM responding | `curl /api/v1/llm/budget` | 200 OK |

---

## Success Criteria for Day 19

- [ ] ≥3 attack types produce visible alerts in the frontend
- [ ] LLM narratives are generated and coherent for each alert
- [ ] At least 3 PCAP demo files created and verified
- [ ] E2E walkthrough documented with pass/fail
- [ ] Demo accounts created (can defer to later if auth flow has issues)
- [ ] VPS infrastructure verified healthy

---

## Architectural Compliance Notes

All Day 19 tasks are **within the PART5 §7-8 scope** (Testing Strategy + Demo Day Preparation). No new modules, features, or technologies are being introduced. This is pure verification and demo readiness work.

---

_Day 19 — PLANNED_
_Focus: Real traffic testing → Attack simulation → Demo preparation_
_Version: v0.6.0 (1 week ahead of schedule)_
_Reference: PART5 §7.3 (Demo Scenarios), §8.1 (Demo Script), §8.3 (Pre-Demo Checklist)_
