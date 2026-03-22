# ThreatMatrix AI — VPS Troubleshooting Plan

> **Date:** March 22, 2026  
> **Issue:** Capture engine running but no flows in PostgreSQL; API endpoints returning "Not Found"  
> **Status:** 🔴 Critical — Day 7 verification blocked  
> **Root Cause:** Network isolation between capture engine (host network) and backend services (bridge network)

---

## 📊 Issue Summary

### Symptoms Observed

| Symptom | Evidence | Impact |
|---------|----------|--------|
| **No flows in PostgreSQL** | `SELECT COUNT(*) FROM network_flows;` → 0 | Cannot verify flow persistence |
| **API endpoints "Not Found"** | `curl /api/v1/capture/status` → `{"detail":"Not Found"}` | Cannot control capture via API |
| **Capture engine running** | Logs show: `[Engine] Capture loop started on eth0` | Engine is operational |
| **Redis connected** | Logs show: `[Publisher] Connected to Redis at redis://localhost:6379` | Redis connectivity OK |
| **System health OK** | `curl /api/v1/system/health` → operational | Backend is running |

### Root Cause Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPS NETWORK TOPOLOGY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOST NETWORK (eth0)                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Capture Engine (network_mode: host)                     │    │
│  │  • Tries: redis://localhost:6379 ✅ (port exposed)       │    │
│  │  • Tries: postgresql://localhost:5432 ✅ (port exposed)  │    │
│  │  • Publishes to: flows:live channel ✅                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  DOCKER BRIDGE NETWORK (threatmatrix_net)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Backend (FastAPI)                                       │    │
│  │  • Connects to: redis://redis:6379 ✅                    │    │
│  │  • Connects to: postgresql://postgres:5432 ✅            │    │
│  │  • Subscribes to: flows:live channel ❓ (not verified)   │    │
│  │  • API: /api/v1/capture/* ❌ (returns "Not Found")       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (port 5432 exposed to host)                  │    │
│  │  • network_flows table: 0 rows ❌                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Redis (port 6379 exposed to host)                       │    │
│  │  • flows:live channel: subscribed❓                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Identified Issues

1. **Issue #1: Backend not subscribing to Redis flows:live channel**
   - The capture engine publishes flows to Redis `flows:live` channel
   - The backend needs to subscribe to this channel and persist flows to PostgreSQL
   - Current status: Backend is running but NOT subscribing to flows

2. **Issue #2: Capture API endpoints returning "Not Found"**
   - The capture router is registered in `backend/app/api/v1/__init__.py`
   - But endpoints return "Not Found" when called
   - Possible cause: Backend not fully initialized or route registration issue

3. **Issue #3: No flow persistence service active**
   - The capture engine publishes to Redis but doesn't persist to PostgreSQL directly
   - A separate service (backend) should subscribe and persist
   - Current status: This service is not running

---

## 🔧 Solution Architecture

### Current Flow (Broken)

```
Capture Engine → Redis (flows:live) → ❌ NO SUBSCRIBER → PostgreSQL (empty)
```

### Target Flow (Working)

```
Capture Engine → Redis (flows:live) → Backend Subscriber → PostgreSQL (network_flows)
                                    → WebSocket → Browser (real-time)
```

### Required Components

1. **Redis Subscriber in Backend** — Subscribe to `flows:live` channel
2. **Flow Persistence Service** — Save flows to PostgreSQL
3. **WebSocket Broadcasting** — Forward flows to connected browsers
4. **Capture API Endpoints** — Control capture engine via REST API

---

## 📋 Troubleshooting Steps

### Phase 1: Verify Current State (5 minutes)

#### Step 1.1: Check Docker Services Status

```bash
# SSH into VPS
ssh root@187.124.45.161

# Navigate to project directory
cd /home/threatmatrix/threatmatrix-ai

# Check all Docker services
docker compose ps

# Expected output:
# NAME            STATUS
# tm-postgres     Up (healthy)
# tm-redis        Up (healthy)
# tm-backend      Up
# tm-capture      Up
# tm-ml-worker    Up
```

**If tm-backend is not running:**
```bash
# Start backend
docker compose up -d backend

# Check logs
docker compose logs backend --tail=50
```

#### Step 1.2: Check Backend Logs for Errors

```bash
# View backend logs
docker compose logs backend --tail=100

# Look for:
# - "WebSocket Redis listener started" ✅
# - "Redis connected successfully" ✅
# - Any error messages ❌
```

#### Step 1.3: Verify Redis Subscriber

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Check subscribers to flows:live
PUBSUB NUMSUB flows:live

# Expected: 1) "flows:live" 2) (integer) 1
# If 0 subscribers: Backend is NOT subscribing
```

#### Step 1.4: Test Capture API Endpoint

```bash
# Test from VPS
curl http://localhost:8000/api/v1/capture/status

# Expected: {"status":"stopped"} or {"status":"running",...}
# Actual: {"detail":"Not Found"} ❌
```

---

### Phase 2: Fix Backend Redis Subscription (10 minutes)

#### Step 2.1: Check WebSocket Manager Implementation

The backend should subscribe to Redis `flows:live` channel on startup. Check if this is implemented:

```bash
# View WebSocket manager
cat backend/app/api/v1/websocket.py | grep -A 20 "start_redis_listener"
```

**Expected implementation:**
```python
async def start_redis_listener(self, redis_manager):
    """Subscribe to Redis channels for real-time events."""
    # Should subscribe to: flows:live, ml:live, system:status
```

**If not implemented:** This is the root cause. The backend needs to subscribe to Redis channels.

#### Step 2.2: Verify Redis Connection in Backend

```bash
# Check backend environment variables
docker compose exec backend env | grep REDIS

# Expected: REDIS_URL=redis://redis:6379
```

#### Step 2.3: Test Redis Connectivity from Backend

```bash
# Execute Python in backend container
docker compose exec backend python -c "
import redis
import os

redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
client = redis.from_url(redis_url, decode_responses=True)

# Test connection
try:
    client.ping()
    print('✅ Redis connection successful')
    
    # Test publish
    client.publish('flows:live', '{\"test\": \"message\"}')
    print('✅ Published test message to flows:live')
    
    # Check subscribers
    subs = client.pubsub_numsub('flows:live')
    print(f'✅ Subscribers to flows:live: {subs}')
except Exception as e:
    print(f'❌ Redis error: {e}')
"
```

---

### Phase 3: Fix Capture API Endpoints (10 minutes)

#### Step 3.1: Check FastAPI Route Registration

```bash
# View all registered routes
docker compose exec backend python -c "
from app.main import app

print('Registered routes:')
for route in app.routes:
    if hasattr(route, 'path'):
        print(f'  {route.path}')
" | grep capture
```

**Expected output:**
```
/api/v1/capture/status
/api/v1/capture/start
/api/v1/capture/stop
/api/v1/capture/interfaces
```

**If not found:** Routes are not registered properly.

#### Step 3.2: Check Backend Startup Logs

```bash
# View backend startup logs
docker compose logs backend | head -20

# Look for:
# - "[TM] ThreatMatrix AI v0.1.0 starting..."
# - "Uvicorn running on http://0.0.0.0:8000"
# - Any import errors
```

#### Step 3.3: Test Direct Import

```bash
# Test if capture module can be imported
docker compose exec backend python -c "
try:
    from app.api.v1.capture import router
    print('✅ Capture router imported successfully')
    print(f'Routes: {[r.path for r in router.routes]}')
except Exception as e:
    print(f'❌ Import error: {e}')
    import traceback
    traceback.print_exc()
"
```

#### Step 3.4: Restart Backend with Fresh State

```bash
# Stop backend
docker compose stop backend

# Remove backend container
docker compose rm -f backend

# Rebuild and start
docker compose up -d --build backend

# Wait for startup
sleep 10

# Check logs
docker compose logs backend --tail=30
```

---

### Phase 4: Verify Flow Persistence (10 minutes)

#### Step 4.1: Check if Flow Persistence Service Exists

```bash
# Look for flow persistence service
ls -la backend/app/services/ | grep flow

# Expected: flow_service.py, flow_persistence.py
```

#### Step 4.2: Check Flow Service Implementation

```bash
# View flow persistence service
cat backend/app/services/flow_persistence.py | head -50
```

**Expected:** A service that subscribes to Redis and saves to PostgreSQL.

#### Step 4.3: Test Flow Persistence Manually

```bash
# Execute test flow persistence
docker compose exec backend python -c "
import asyncio
import json
import redis.asyncio as redis
from app.services.flow_persistence import FlowPersistenceService

async def test():
    # Connect to Redis
    redis_client = redis.from_url('redis://redis:6379', decode_responses=True)
    
    # Create test flow
    test_flow = {
        'event': 'new_flow',
        'payload': {
            'src_ip': '10.0.1.5',
            'dst_ip': '8.8.8.8',
            'src_port': 54321,
            'dst_port': 80,
            'protocol': 6,
            'duration': 1.5,
            'total_bytes': 1024,
            'total_packets': 10,
            'features': {'test': True}
        }
    }
    
    # Publish test flow
    await redis_client.publish('flows:live', json.dumps(test_flow))
    print('✅ Published test flow to Redis')
    
    # Wait for persistence
    await asyncio.sleep(2)
    
    # Check PostgreSQL
    from app.database import get_session
    async with get_session() as session:
        result = await session.execute('SELECT COUNT(*) FROM network_flows')
        count = result.scalar()
        print(f'✅ Flows in PostgreSQL: {count}')

asyncio.run(test())
"
```

---

### Phase 5: Generate Test Traffic (5 minutes)

#### Step 5.1: Generate Normal Traffic

```bash
# From VPS, generate normal traffic
curl https://google.com
curl https://github.com
ping -c 5 8.8.8.8
dig google.com
```

#### Step 5.2: Run Attack Simulation

```bash
# From your local machine (WSL), scan VPS
nmap -sS 187.124.45.161

# From VPS, scan localhost
nmap -sS localhost -p 80,443,8000,22
```

#### Step 5.3: Verify Flows in Redis

```bash
# Subscribe to flows:live channel
docker compose exec redis redis-cli

# In Redis CLI:
SUBSCRIBE flows:live

# You should see flow messages appearing
# Press Ctrl+C to exit
```

#### Step 5.4: Verify Flows in PostgreSQL

```bash
# Check PostgreSQL for flows
docker compose exec postgres psql -U threatmatrix -d threatmatrix

# In PostgreSQL:
SELECT COUNT(*) FROM network_flows;
SELECT * FROM network_flows ORDER BY created_at DESC LIMIT 5;

# Expected: Multiple rows with flow data
```

---

### Phase 6: Verify API Endpoints (5 minutes)

#### Step 6.1: Test All Capture Endpoints

```bash
# Test status endpoint
curl http://localhost:8000/api/v1/capture/status

# Test interfaces endpoint
curl http://localhost:8000/api/v1/capture/interfaces

# Test start endpoint (requires auth)
curl -X POST http://localhost:8000/api/v1/capture/start \
  -H "Content-Type: application/json" \
  -d '{"interface": "eth0"}'
```

#### Step 6.2: Test with Authentication

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@threatmatrix.local", "password": "admin123"}' \
  | jq -r '.access_token')

# Test capture status with auth
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/capture/status
```

#### Step 6.3: Check API Documentation

```bash
# View OpenAPI docs
curl http://localhost:8000/openapi.json | jq '.paths | keys' | grep capture
```

---

## 🎯 Verification Checklist

### After completing all phases, verify:

- [ ] Docker services all running (`docker compose ps`)
- [ ] Backend logs show "WebSocket Redis listener started"
- [ ] Redis has 1 subscriber to `flows:live` channel
- [ ] Capture engine is running and capturing packets
- [ ] Flows appearing in Redis `flows:live` channel
- [ ] Flows persisting to PostgreSQL `network_flows` table
- [ ] API endpoint `/api/v1/capture/status` returns JSON (not "Not Found")
- [ ] API endpoint `/api/v1/capture/interfaces` returns interface list
- [ ] Test traffic generates flows in database
- [ ] Attack simulation (nmap) generates anomaly flows

---

## 🚨 Emergency Fixes

### If Backend Won't Start

```bash
# Check for port conflicts
netstat -tlnp | grep 8000

# Check for database connection issues
docker compose exec backend python -c "
from app.database import engine
import asyncio

async def test():
    try:
        async with engine.connect() as conn:
            print('✅ Database connection successful')
    except Exception as e:
        print(f'❌ Database error: {e}')

asyncio.run(test())
"
```

### If Redis Subscription Fails

```bash
# Manually test Redis subscription
docker compose exec backend python -c "
import asyncio
import redis.asyncio as redis

async def test():
    client = redis.from_url('redis://redis:6379', decode_responses=True)
    pubsub = client.pubsub()
    
    await pubsub.subscribe('flows:live')
    print('✅ Subscribed to flows:live')
    
    # Listen for messages
    async for message in pubsub.listen():
        if message['type'] == 'message':
            print(f'✅ Received: {message[\"data\"]}')
            break

asyncio.run(test())
"
```

### If Capture Engine Can't Connect to Redis

```bash
# Test Redis connectivity from capture container
docker compose exec capture python -c "
import redis
import os

redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
client = redis.from_url(redis_url, decode_responses=True)

try:
    client.ping()
    print('✅ Redis connection successful')
except Exception as e:
    print(f'❌ Redis error: {e}')
"
```

---

## 📊 Success Criteria

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Flows in PostgreSQL** | > 0 rows | `SELECT COUNT(*) FROM network_flows;` |
| **Redis subscribers** | 1 subscriber | `PUBSUB NUMSUB flows:live` |
| **API endpoints** | 200 OK | `curl /api/v1/capture/status` |
| **Capture engine** | Running | `docker compose logs capture` |
| **Test traffic** | Flows generated | Run curl/ping/nmap commands |

---

## 📝 Next Steps After Fix

1. **Complete Day 7 verification** — Run all verification steps from `docs/vps_analysis_and_setup_guide.md`
2. **Update SESSION_HANDOFF.md** — Document VPS setup completion
3. **Proceed to Day 8** — Feature extraction validation, War Room ThreatMap
4. **Test frontend connection** — Update `NEXT_PUBLIC_API_URL` to VPS IP

---

*Plan created: March 22, 2026*  
*Status: Ready for execution*  
*Priority: 🔴 Critical — Day 7 verification blocked*
