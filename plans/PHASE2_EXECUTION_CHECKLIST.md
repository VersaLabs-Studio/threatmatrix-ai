# ThreatMatrix AI — Phase 2: Attack Simulation Execution Checklist

> **Date:** 2026-04-03
> **VPS:** 187.124.45.161:8000
> **Frontend:** http://localhost:3000
> **Timezone:** UTC+3 (Africa/Addis_Ababa)

---

## Instructions for Manual Execution

1. **Copy each command block** and paste into your terminal
2. **Record the output** (copy/paste back to me after each step)
3. **Take screenshots** where indicated for visual confirmation
4. **Note timestamps** precisely for latency calculation

---

## PHASE 2.1: Pre-Flight System Health Verification

### Step 2.1.1: Verify Backend API Health

```bash
curl -s http://187.124.45.161:8000/api/v1/system/health | python3 -m json.tool
```

**Expected Output:**
```json
{
  "status": "operational",
  "components": {
    "api": "healthy",
    "database": "healthy",
    "redis": {"status": "healthy", "latency_ms": <5},
    "capture_engine": "active",
    "ml_worker": "active"
  }
}
```

**Record:**
- [ ] API status: _________
- [ ] Database status: _________
- [ ] Redis status: _________
- [ ] Capture engine status: _________
- [ ] ML worker status: _________

---

### Step 2.1.2: Verify Capture Engine Status

```bash
curl -s http://187.124.45.161:8000/api/v1/capture/status | python3 -m json.tool
```

**Expected Output:**
```json
{
  "status": "running",
  "interface": "eth0",
  "packets_captured": >0,
  "flows_completed": >0,
  "flows_published": >0,
  "active_flows": >0,
  "uptime_seconds": >0
}
```

**Record:**
- [ ] Capture status: _________
- [ ] Packets captured: _________
- [ ] Flows completed: _________
- [ ] Active flows: _________

---

### Step 2.1.3: Verify ML Worker Status

```bash
curl -s http://187.124.45.161:8000/api/v1/ml/status | python3 -m json.tool
```

**Expected Output:**
```json
{
  "flows_scored": >0,
  "anomalies_detected": >0,
  "alerts_created": >0,
  "errors": 0
}
```

**Record:**
- [ ] Flows scored (pre-attack): _________
- [ ] Anomalies detected (pre-attack): _________
- [ ] Alerts created (pre-attack): _________

---

### Step 2.1.4: Record Pre-Attack Alert Baseline

```bash
curl -s http://187.124.45.161:8000/api/v1/alerts/stats | python3 -m json.tool
```

**Record:**
- [ ] Total alerts (pre-attack): _________
- [ ] Open alerts: _________
- [ ] Severity distribution: _________

---

### Step 2.1.5: Verify Frontend is Running

**Action:** Open browser to http://localhost:3000/war-room

**Visual Confirmation Checklist:**
- [ ] Page loads without errors
- [ ] Metric cards show data (Packets/Sec, Active Flows, etc.)
- [ ] Threat Map renders (Deck.gl visualization)
- [ ] Live Alert Feed shows existing alerts (if any)
- [ ] No console errors (open DevTools with F12 → Console tab)

**Screenshot Required:**
- [ ] Take screenshot of War Room page before attack

---

### Step 2.1.6: Verify WebSocket Connection

**Action:** Open browser DevTools (F12) → Console tab

**Run in Console:**
```javascript
// Check WebSocket connection status
console.log('[WS Check] Ready to monitor for alerts');
```

**Visual Confirmation:**
- [ ] No WebSocket errors in console
- [ ] Network tab shows WS connection to ws://187.124.45.161:8000

---

## PHASE 2.2: Launch Port Scan Attack

### Step 2.2.1: Record T0 (Attack Start Time)

**Action:** Note the exact time before running the attack command.

**Record:**
- [ ] T0 (HH:MM:SS UTC+3): _________
- [ ] T0 (ISO 8601): _________

---

### Step 2.2.2: Execute nmap Port Scan

**Option A — Using nmap directly (recommended):**

```bash
nmap -sS -p 1-1024 187.124.45.161 --max-retries 1 -T4
```

**Option B — Using project script (if nmap not available):**

```bash
cd scripts/attack_simulation
bash 01_port_scan.sh 187.124.45.161
```

**Option C — Using Python script (cross-platform fallback):**

```bash
python scripts/attack_simulation/run_external_attacks.py --target 187.124.45.161 --attack port_scan
```

**Record:**
- [ ] Attack command used: _________
- [ ] Attack started at: _________
- [ ] nmap output (copy full output):
```
[PASTE nmap OUTPUT HERE]
```

---

## PHASE 2.3: Monitor for Alert Detection

### Step 2.3.1: Poll API for New Alerts (Run Immediately After Attack)

**Run this command repeatedly every 5 seconds:**

```bash
# Run this in a loop - copy/paste the entire block
for i in $(seq 1 12); do
  echo "=== Poll $i at $(date '+%H:%M:%S') ==="
  curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=3&sort=desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data.get('items', data) if isinstance(data, dict) else data
if alerts:
    a = alerts[0]
    print(f'  Latest Alert: {a.get(\"title\", \"?\")}')
    print(f'  Category: {a.get(\"category\", \"?\")}')
    print(f'  Severity: {a.get(\"severity\", \"?\")}')
    print(f'  Confidence: {a.get(\"confidence\", 0):.2%}')
    print(f'  Created: {a.get(\"created_at\", \"?\")}')
else:
    print('  No alerts found')
"
  echo ""
  sleep 5
done
```

**Record:**
- [ ] Copy full polling output
- [ ] Note which poll number first showed the new alert: _________

---

### Step 2.3.2: Visual Monitoring — War Room Live Alert Feed

**Action:** Watch the War Room page (http://localhost:3000/war-room)

**Visual Confirmation:**
- [ ] New alert appears in LiveAlertFeed component
- [ ] Alert shows severity badge (MEDIUM/HIGH/CRITICAL)
- [ ] Alert shows category (port_scan or probe)
- [ ] Alert shows source IP (your local machine IP)
- [ ] Alert shows destination IP (187.124.45.161)

**Record:**
- [ ] T1 (alert appearance time in UI): _________ (HH:MM:SS UTC+3)
- [ ] Screenshot of War Room with new alert visible

---

### Step 2.3.3: Record T1 and Calculate Latency

**Record:**
- [ ] T1 (HH:MM:SS UTC+3): _________
- [ ] Detection latency (T1 - T0): _________ seconds
- [ ] Target: < 60 seconds → [ ] PASS / [ ] FAIL

---

## PHASE 2.4: Verify Alert Properties

### Step 2.4.1: Get Full Alert Details

```bash
# Get the latest alert with full details
curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=1&sort=desc" | python3 -m json.tool
```

**Record:** Full JSON response (copy entire output)

```json
[PASTE FULL ALERT JSON HERE]
```

---

### Step 2.4.2: Verify Alert Category

```bash
# Extract and verify category
curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=1&sort=desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data.get('items', data) if isinstance(data, dict) else data
if alerts:
    a = alerts[0]
    category = a.get('category', 'UNKNOWN')
    print(f'Alert Category: {category}')
    if category in ['port_scan', 'probe']:
        print('✅ PASS: Category matches expected port_scan/probe')
    else:
        print('⚠️ WARNING: Category does not match expected value')
"
```

**Record:**
- [ ] Category: _________
- [ ] Expected: "port_scan" or "probe"
- [ ] Result: [ ] PASS / [ ] FAIL

---

### Step 2.4.3: Verify Alert Severity

```bash
# Extract and verify severity
curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=1&sort=desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data.get('items', data) if isinstance(data, dict) else data
if alerts:
    a = alerts[0]
    severity = a.get('severity', 'UNKNOWN').lower()
    valid_severities = ['medium', 'high', 'critical']
    print(f'Alert Severity: {severity}')
    if severity in valid_severities:
        print('✅ PASS: Severity >= MEDIUM')
    else:
        print('⚠️ WARNING: Severity below MEDIUM')
"
```

**Record:**
- [ ] Severity: _________
- [ ] Expected: "medium", "high", or "critical"
- [ ] Result: [ ] PASS / [ ] FAIL

---

### Step 2.4.4: Verify ML Confidence Score

```bash
# Extract and verify confidence
curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=1&sort=desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data.get('items', data) if isinstance(data, dict) else data
if alerts:
    a = alerts[0]
    confidence = a.get('confidence', 0)
    print(f'ML Confidence: {confidence:.2%}')
    if confidence >= 0.50:
        print('✅ PASS: Confidence >= 50%')
    else:
        print('⚠️ WARNING: Confidence below 50%')
"
```

**Record:**
- [ ] Confidence: _________
- [ ] Expected: ≥ 0.50 (50%)
- [ ] Result: [ ] PASS / [ ] FAIL

---

### Step 2.4.5: Verify AI Narrative Generation

```bash
# Extract and verify AI narrative
curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=1&sort=desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data.get('items', data) if isinstance(data, dict) else data
if alerts:
    a = alerts[0]
    narrative = a.get('ai_narrative', '')
    if narrative and len(narrative) > 20:
        print('✅ PASS: AI narrative generated')
        print(f'Narrative length: {len(narrative)} characters')
        print(f'Narrative preview: {narrative[:200]}...')
    else:
        print('⚠️ WARNING: AI narrative missing or too short')
        print(f'Narrative value: {narrative}')
"
```

**Record:**
- [ ] AI narrative present: [ ] YES / [ ] NO
- [ ] Narrative length: _________ characters
- [ ] Narrative quality rating (1-5): _________
- [ ] Full narrative text:
```
[PASTE FULL AI NARRATIVE HERE]
```

---

## PHASE 2.5: Verify ML Pipeline Details

### Step 2.5.1: Check ML Worker Stats After Attack

```bash
curl -s http://187.124.45.161:8000/api/v1/ml/status | python3 -m json.tool
```

**Record:**
- [ ] Flows scored (post-attack): _________
- [ ] Anomalies detected (post-attack): _________
- [ ] Alerts created (post-attack): _________
- [ ] New flows scored since pre-attack: _________
- [ ] New alerts created since pre-attack: _________

---

### Step 2.5.2: Verify Flow Statistics Increased

```bash
curl -s http://187.124.45.161:8000/api/v1/flows/stats | python3 -m json.tool
```

**Record:**
- [ ] Total flows (post-attack): _________
- [ ] Total packets (post-attack): _________
- [ ] New flows since pre-attack: _________

---

## PHASE 2.6: Final Verification Summary

### Step 2.6.1: Complete Results Table

| Criterion | Target | Actual | Pass/Fail |
|-----------|--------|--------|-----------|
| Alert appears in War Room | Yes | _________ | [ ] |
| Detection latency | < 60 seconds | _________ s | [ ] |
| Alert category | "port_scan" or "probe" | _________ | [ ] |
| Alert severity | ≥ MEDIUM | _________ | [ ] |
| ML confidence | ≥ 50% | _________ | [ ] |
| AI narrative generated | Yes | _________ | [ ] |

**Overall Result:** [ ] ALL PASS / [ ] PARTIAL / [ ] FAIL

---

### Step 2.6.2: Screenshot Checklist

- [ ] War Room page before attack (Step 2.1.5)
- [ ] War Room page with new alert visible (Step 2.3.2)
- [ ] Alert detail view (if navigating to /alerts page)
- [ ] Browser console (showing no errors)

---

### Step 2.6.3: Output Collection

**Please provide the following outputs after execution:**

1. **Step 2.1.1 output** — Health endpoint response
2. **Step 2.1.2 output** — Capture status response
3. **Step 2.1.3 output** — ML worker status response
4. **Step 2.1.4 output** — Pre-attack alert stats
5. **Step 2.2.2 output** — Full nmap output
6. **Step 2.3.1 output** — Full polling loop output
7. **Step 2.4.1 output** — Full alert JSON response
8. **Step 2.5.1 output** — Post-attack ML worker stats
9. **Step 2.5.2 output** — Post-attack flow stats
10. **Screenshots** — War Room before/after

---

## Troubleshooting Commands

### If No Alert Appears After 60 Seconds

```bash
# Check if capture is running
curl -s http://187.124.45.161:8000/api/v1/capture/status | python3 -m json.tool

# Check if ML worker is running
curl -s http://187.124.45.161:8000/api/v1/ml/status | python3 -m json.tool

# Check recent alerts (in case alert was created but not visible)
curl -s "http://187.124.45.161:8000/api/v1/alerts/?limit=10&sort=desc" | python3 -c "
import sys, json
data = json.load(sys.stdin)
alerts = data.get('items', data) if isinstance(data, dict) else data
for a in alerts[:5]:
    print(f'[{a.get(\"severity\", \"?\").upper()}] {a.get(\"title\", \"?\")} | Category: {a.get(\"category\", \"?\")} | Created: {a.get(\"created_at\", \"?\")}')
"
```

### If WebSocket Not Connecting

```javascript
// Run in browser console
console.log('Checking WebSocket status...');
// Check Network tab for ws://187.124.45.161:8000/ws connection
```

### Force Refresh Alert Feed

```javascript
// Run in browser console to trigger manual refetch
fetch('http://187.124.45.161:8000/api/v1/alerts/?limit=10')
  .then(r => r.json())
  .then(d => console.log('Latest alerts:', JSON.stringify(d, null, 2)))
  .catch(e => console.error('Fetch failed:', e));
```

---

_Phase 2 Execution Checklist — Ready for manual execution_
_Reference: plans/PHASE2_ATTACK_SIMULATION_PLAN.md, plans/E2E_WALKTHROUGH_PLAN.md Step 2_
