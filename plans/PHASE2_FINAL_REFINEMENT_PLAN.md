# ThreatMatrix AI — Phase 2.6: Final Refinement Plan

> **Date:** 2026-04-05
> **Purpose:** Complete remaining Phase 2 tasks + AI Briefing caching optimization

---

## Tasks

### Task 1: Detection Latency Logging
**File:** `backend/ml/inference/worker.py`

Add timestamp tracking from flow reception to alert creation:
- Log flow received timestamp
- Log alert created timestamp
- Calculate and log detection latency
- Publish latency metrics to Redis for frontend display

### Task 2: AI Briefing Caching
**Files:** `backend/app/api/v1/llm.py`, `frontend/components/war-room/AIBriefingWidget.tsx`

Instead of generating a new briefing on every War Room load:
- Generate briefing once when new alerts arrive
- Store briefing in Redis with TTL (e.g., 10 minutes)
- War Room fetches cached briefing instantly
- Background job regenerates briefing periodically

**Implementation:**
1. Add `/api/v1/llm/briefing/cache` endpoint
2. Store briefing in Redis key `warroom:briefing`
3. Auto-regenerate when new alerts detected or TTL expires
4. Frontend fetches cached briefing first, falls back to generation

### Task 3: WebSocket Connection Fix
**Files:** `frontend/lib/websocket.ts`, `frontend/hooks/useWebSocket.ts`

Fix WebSocket connection for real-time alert push:
- Debug connection issues in DEV_MODE
- Add reconnection logic with exponential backoff
- Verify WebSocket URL matches VPS address
- Add connection status indicator in UI

### Task 4: Diverse Attack Simulation
**Scripts:** `scripts/attack_simulation/`

Test different attack types for severity verification:

| Attack | Script | Expected Category | Expected Severity |
|--------|--------|-------------------|-------------------|
| Port Scan | `01_port_scan.sh` | port_scan | MEDIUM |
| DDoS | `02_ddos_simulation.sh` | ddos | HIGH/CRITICAL |
| DNS Tunnel | `03_dns_tunnel.py` | dns_tunnel | MEDIUM |
| Brute Force | `04_brute_force.sh` | brute_force | MEDIUM/HIGH |
| Normal Traffic | `05_normal_traffic.sh` | none | NONE (benign) |

---

## Execution Order

1. **AI Briefing Caching** — Highest impact on UX
2. **Detection Latency Logging** — Add to ML worker
3. **WebSocket Fix** — Enable real-time push
4. **Diverse Attack Simulation** — Run all 5 scripts

---

_Phase 2.6 Final Refinement Plan — Ready for implementation_
