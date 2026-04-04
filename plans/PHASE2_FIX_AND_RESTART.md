# ThreatMatrix AI — Phase 2.1 Fix: Restart Capture Engine and ML Worker

> **Issue:** Capture Engine is `stopped`, ML Worker is `idle`
> **Solution:** Restart Docker containers on VPS

---

## Step 1: Restart Capture Engine and ML Worker

**Run these commands on the VPS (SSH):**

```bash
cd /home/threatmatrix/threatmatrix-ai

# Restart capture engine
docker-compose restart capture

# Restart ML worker
docker-compose restart ml-worker

# Also restart backend to ensure clean state
docker-compose restart backend

# Wait 10 seconds for services to initialize
sleep 10

# Verify all containers are running
docker-compose ps
```

---

## Step 2: Verify Services Are Running

```bash
# Check health endpoint
curl -s http://localhost:8000/api/v1/system/health | python3 -m json.tool

# Check capture status
curl -s http://localhost:8000/api/v1/capture/status | python3 -m json.tool

# Check ML worker status
curl -s http://localhost:8000/api/v1/ml/status | python3 -m json.tool
```

**Expected Output:**
- `capture_engine`: "active" or "running"
- `ml_worker`: "active" or "running"
- `database`: "healthy" (was "pending" before)

---

## Step 3: Record Pre-Attack Baseline (After Restart)

```bash
# Record alert count before fresh attack
curl -s http://localhost:8000/api/v1/alerts/stats | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Total alerts: {data.get(\"total\", 0)}')
print(f'By severity: {data.get(\"by_severity\", {})}')
print(f'By category: {data.get(\"by_category\", {})}')
"
```

**Record:**
- Total alerts (pre-attack): _________
- T0 (attack start time): _________

---

## Step 4: Re-Run Port Scan Attack

**Run from your LOCAL Windows machine (not VPS):**

```bash
# Record T0 first, then run:
nmap -sS -p 1-1024 187.124.45.161 --max-retries 1 -T4
```

**Record T0:** _________ (HH:MM:SS UTC+3)

---

## Step 5: Monitor for New Alerts (Run on VPS)

```bash
# Poll for new alerts every 5 seconds (run immediately after nmap starts)
for i in $(seq 1 12); do
  echo "=== Poll $i at $(date '+%H:%M:%S') ==="
  curl -s "http://localhost:8000/api/v1/alerts/?limit=3&sort=desc" | python3 -c "
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

---

## Step 6: Verify New Alert Details

```bash
# Get full details of the latest alert
curl -s "http://localhost:8000/api/v1/alerts/?limit=1&sort=desc" | python3 -m json.tool
```

---

## Troubleshooting

### If Capture Engine Still Shows "stopped"

```bash
# Check capture logs
docker-compose logs --tail=50 capture

# Check if there's a network interface issue
docker-compose exec capture ip link show
```

### If ML Worker Shows "idle"

```bash
# Check ML worker logs
docker-compose logs --tail=50 ml-worker

# Verify models are loaded
curl -s http://localhost:8000/api/v1/ml/models | python3 -m json.tool
```

### If Database Still Shows "pending"

```bash
# Check database connection
docker-compose exec backend python3 -c "
from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Database connection: OK')
"
```

---

_Phase 2.1 Fix — Restart services and re-run attack_
