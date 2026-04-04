# ThreatMatrix AI — Phase 2.5: Refinement & Fine-Tuning Plan

> **Date:** 2026-04-04
> **Purpose:** Fix health endpoint accuracy, War Room alert display, detection latency logging, and attack simulation diversity

---

## Issues Identified

### Issue 1: Health Endpoint Returns Hardcoded Status
**File:** `backend/app/api/v1/system.py:44-53`
**Problem:** `database`, `capture_engine`, `ml_worker` status are hardcoded as "pending" and "idle"
**Root Cause:** These were TODOs that were never implemented
**Impact:** Dashboard shows incorrect status despite Docker logs confirming active services

**Fix:** Query Redis for capture/ML worker status, ping database for health

### Issue 2: Capture Status Endpoint Returns "stopped"
**File:** `backend/app/api/v1/capture.py:58-59`
**Problem:** `_capture_engine` global is None when capture runs in Docker container
**Root Cause:** The API and capture engine run in separate processes/containers
**Impact:** API can't see the Docker container's capture engine state

**Fix:** Query Redis for capture stats (packets_captured, flows_completed) to determine live status

### Issue 3: No ML Worker Status Endpoint
**Problem:** ML worker runs in separate container, no API endpoint to check its status
**Impact:** Can't verify ML worker is active via API

**Fix:** Create `/ml/worker/status` endpoint that reads from Redis

### Issue 4: War Room Not Displaying New Alerts
**Problem:** Frontend shows old PCAP alerts, not new live alerts
**Root Cause:** Need to debug — could be API pagination, WebSocket connection, or data mapping

**Fix:** Add console logging, verify API response format, check WebSocket connection

### Issue 5: Detection Latency Not Logged
**Problem:** No timestamp tracking from attack → detection → alert creation
**Impact:** Can't measure actual detection latency

**Fix:** Add timestamp logging to ML worker when creating alerts

### Issue 6: Attack Simulation Needs Diverse Severity Levels
**Problem:** Only nmap port scan tested (produces MEDIUM severity)
**Impact:** Haven't verified CRITICAL, HIGH, LOW detection

**Fix:** Run multiple attack types with expected severity levels

---

## Implementation Plan

### Fix 1: Health Endpoint — Accurate Status
**File:** `backend/app/api/v1/system.py`

```python
# Replace hardcoded status with actual checks:
# - Database: ping with SELECT 1
# - Capture engine: check Redis for capture stats
# - ML worker: check Redis for ML worker stats
```

### Fix 2: Capture Status — Query Redis
**File:** `backend/app/api/v1/capture.py`

```python
# Instead of checking _capture_engine global:
# - Query Redis for capture stats (packets, flows, uptime)
# - Return "running" if packets > 0 and flows > 0
```

### Fix 3: ML Worker Status Endpoint
**File:** `backend/app/api/v1/ml.py` (new endpoint)

```python
@router.get("/worker/status")
async def get_worker_status():
    # Query Redis for ML worker stats
    # Return: flows_scored, anomalies_detected, alerts_created, uptime
```

### Fix 4: War Room Alert Display Debug
**Files:** `frontend/app/war-room/page.tsx`, `frontend/components/war-room/LiveAlertFeed.tsx`

- Add console.log for API response
- Verify alert data format matches component expectations
- Check WebSocket connection status

### Fix 5: Detection Latency Logging
**File:** `backend/ml/inference/worker.py`

```python
# Add timestamp tracking:
# - Log flow received timestamp
# - Log alert created timestamp
# - Calculate and log detection latency
```

### Fix 6: Diverse Attack Simulation
**Scripts:** `scripts/attack_simulation/`

| Attack | Expected Category | Expected Severity |
|--------|------------------|-------------------|
| Port Scan (nmap -sS) | port_scan | MEDIUM |
| DDoS (hping3 flood) | ddos | HIGH/CRITICAL |
| Brute Force (hydra SSH) | brute_force | MEDIUM/HIGH |
| DNS Tunnel (python script) | dns_tunnel | MEDIUM |
| Normal Traffic (curl browsing) | none (benign) | NONE |

---

## Execution Order

1. **Fix health endpoint** — System.py, capture.py, ml.py
2. **Verify all endpoints return green** — Test with curl
3. **Debug War Room alert display** — Add logging, fix data mapping
4. **Add detection latency logging** — ML worker timestamps
5. **Run diverse attack simulation** — Multiple attack types
6. **Visual confirmation** — War Room with live alerts

---

_Phase 2.5 Refinement Plan — Ready for implementation_
