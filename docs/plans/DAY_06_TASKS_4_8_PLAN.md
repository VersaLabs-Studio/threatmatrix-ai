# ThreatMatrix AI — Day 6 Tasks 4-8 Completion Plan

> **Date:** March 20, 2026  
> **Phase:** Week 1, Day 6 — Backend Services & WebSocket Infrastructure  
> **Status:** Tasks 1-3 Complete, Tasks 4-8 Pending Verification  
> **Goal:** Complete Week 1 foundation and prepare for Week 2

---

## 📋 Executive Summary

This plan details the completion of Day 6 Tasks 4-8, which involve verifying and integrating the frontend hooks with the backend services implemented in Tasks 1-3. The focus is on ensuring the War Room dashboard connects to live API data and the Week 1 demo requirements are met.

**Reference Documents:**
- `docs/worklog/DAY_06_MAR02.md` — Task specifications
- `docs/master-documentation/MASTER_DOC_PART5_TIMELINE.md` — §2.1 (hooks)
- `docs/master-documentation/MASTER_DOC_PART3_MODULES.md` — §2.3 (War Room components)
- `docs/master-documentation/MASTER_DOC_PART2_ARCHITECTURE.md` — §5.1 (API endpoints)

---

## 🎯 Day 6 Task Breakdown

### TASK 4 — useWebSocket Hook Verification 🟡

**Time Est:** 30 min | **Priority:** 🟡 Medium  
**File:** `frontend/hooks/useWebSocket.ts` (2,896 bytes — exists)

#### 4.1 Hook Interface Requirements (per MASTER_DOC_PART5 §2.1)

```typescript
interface UseWebSocketReturn {
  isConnected: boolean;
  systemStatus: SystemStatus | null;
  lastFlowEvent: FlowEvent | null;
  lastAlertEvent: AlertEvent | null;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  reconnect: () => void;
}
```

#### 4.2 Verification Checklist

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Hook exports | `grep "export.*useWebSocket" hooks/useWebSocket.ts` | Function exported |
| TypeScript compiles | `cd frontend && npx tsc --noEmit` | No errors |
| Auto-connect on mount | Read implementation | Connects with JWT token |
| Reconnection logic | Read implementation | Exponential backoff (1s, 2s, 4s, 8s, max 30s) |
| Channel management | Read implementation | subscribe/unsubscribe functions |
| Event parsing | Read implementation | Handles new_flow, new_alert, capture_status, system_metrics |
| Heartbeat monitoring | Read implementation | Ping/pong every 30 seconds |

#### 4.3 Implementation Requirements

**WebSocket URL:** `ws://localhost:8000/ws/?token=<jwt>`

**Event Handling:**
```typescript
// Parse incoming messages
switch (data.event) {
  case 'new_flow':
    setLastFlowEvent(data.payload);
    break;
  case 'new_alert':
    setLastAlertEvent(data.payload);
    break;
  case 'capture_status':
  case 'system_metrics':
    setSystemStatus(prev => ({ ...prev, ...data.payload }));
    break;
}
```

**Features to Verify:**
- [ ] Auto-connect on mount with JWT token from localStorage
- [ ] Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- [ ] Channel subscription management (subscribe/unsubscribe)
- [ ] Event parsing and state updates
- [ ] Connection status indicator (isConnected boolean)
- [ ] Heartbeat monitoring (ping/pong every 30 seconds)

---

### TASK 5 — useFlows Hook Verification 🟡

**Time Est:** 20 min | **Priority:** 🟡 Medium  
**File:** `frontend/hooks/useFlows.ts` (3,801 bytes — exists)

#### 5.1 Hook Interface Requirements

```typescript
interface UseFlowsReturn {
  flows: Flow[];
  stats: FlowStats | null;
  topTalkers: TopTalker[] | null;
  protocols: ProtocolDistribution[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  searchFlows: (query: FlowSearchQuery) => Promise<Flow[]>;
}
```

#### 5.2 API Endpoints Used

| Function | Endpoint | Method |
|----------|----------|--------|
| `getFlows()` | `/api/v1/flows/?page=1&limit=50` | GET |
| `getStats()` | `/api/v1/flows/stats?interval=1h` | GET |
| `getTopTalkers()` | `/api/v1/flows/top-talkers` | GET |
| `getProtocols()` | `/api/v1/flows/protocols` | GET |
| `searchFlows()` | `/api/v1/flows/search` | POST |

#### 5.3 Verification Checklist

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Hook exports | `grep "export.*useFlows" hooks/useFlows.ts` | Function exported |
| TypeScript compiles | `cd frontend && npx tsc --noEmit` | No errors |
| API integration | Read implementation | Uses api.ts client |
| Auto-refresh | Read implementation | setInterval with 3s (per MASTER_DOC_PART3 §2.3) |
| Loading states | Read implementation | isLoading boolean |
| Error handling | Read implementation | error string |
| Pagination support | Read implementation | page/limit parameters |
| Filter parameters | Read implementation | time_range, src_ip, dst_ip, protocol, is_anomaly, min_score |

#### 5.4 Implementation Requirements

**Features to Verify:**
- [ ] Auto-refresh every 3 seconds (per MASTER_DOC_PART3 §2.3)
- [ ] Loading states (isLoading boolean)
- [ ] Error handling (error string)
- [ ] Pagination support (page, limit parameters)
- [ ] Filter parameters (time_range, src_ip, dst_ip, protocol, is_anomaly, min_score)
- [ ] Sorting (timestamp DESC by default)
- [ ] Uses api.ts client for all requests

---

### TASK 6 — useAlerts Hook Verification 🟡

**Time Est:** 20 min | **Priority:** 🟡 Medium  
**File:** `frontend/hooks/useAlerts.ts` (2,766 bytes — exists)

#### 6.1 Hook Interface Requirements

```typescript
interface UseAlertsReturn {
  alerts: Alert[];
  stats: AlertStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateStatus: (alertId: string, status: AlertStatus) => Promise<void>;
  assignAlert: (alertId: string, userId: string) => Promise<void>;
}
```

#### 6.2 API Endpoints Used

| Function | Endpoint | Method |
|----------|----------|--------|
| `getAlerts()` | `/api/v1/alerts/?severity=&status=` | GET |
| `getStats()` | `/api/v1/alerts/stats` | GET |
| `updateStatus()` | `/api/v1/alerts/{id}/status` | PATCH |
| `assignAlert()` | `/api/v1/alerts/{id}/assign` | PATCH |

#### 6.3 Verification Checklist

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Hook exports | `grep "export.*useAlerts" hooks/useAlerts.ts` | Function exported |
| TypeScript compiles | `cd frontend && npx tsc --noEmit` | No errors |
| Status update | Read implementation | PATCH request logic |
| Auto-refresh | Read implementation | setInterval with 5s |
| Severity filtering | Read implementation | critical, high, medium, low, info |
| Status filtering | Read implementation | open, acknowledged, investigating, resolved, false_positive |
| Optimistic UI updates | Read implementation | Immediate UI feedback |
| Error handling | Read implementation | Toast notifications |

#### 6.4 Implementation Requirements

**Features to Verify:**
- [ ] Auto-refresh every 5 seconds
- [ ] Severity filtering (critical, high, medium, low, info)
- [ ] Status filtering (open, acknowledged, investigating, resolved, false_positive)
- [ ] Optimistic UI updates
- [ ] Error handling with toast notifications
- [ ] Uses api.ts client for all requests

---

### TASK 7 — War Room API Integration 🟡

**Time Est:** 45 min | **Priority:** 🟡 Medium  
**File:** `frontend/app/war-room/page.tsx` (5,247 bytes — exists)

#### 7.1 Components to Connect (per MASTER_DOC_PART3 §2.3)

| Component | Data Source | Hook | Refresh Rate |
|-----------|-------------|------|--------------|
| MetricCard (Pkts/s) | `/flows/stats` | useFlows | 3s |
| MetricCard (Flows) | `/flows/stats` | useFlows | 3s |
| MetricCard (Anomaly%) | `/flows/stats` | useFlows | 3s |
| MetricCard (Threats) | `/alerts/stats` | useAlerts | 5s |
| ProtocolChart | `/flows/protocols` | useFlows | 10s |
| TrafficTimeline | `/flows/stats?interval=1m` | useFlows | 5s |
| LiveAlertFeed | WebSocket `alerts:live` | useWebSocket | Real-time |
| TopTalkers | `/flows/top-talkers` | useFlows | 10s |
| ThreatLevel | `/alerts/stats` | useAlerts | 5s |

#### 7.2 Implementation Pattern

```typescript
'use client';

import { useFlows } from '@/hooks/useFlows';
import { useAlerts } from '@/hooks/useAlerts';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function WarRoomPage() {
  const { stats: flowStats, protocols, topTalkers } = useFlows();
  const { stats: alertStats } = useAlerts();
  const { lastAlertEvent, systemStatus } = useWebSocket();
  
  // Calculate threat level from alert stats
  const threatLevel = calculateThreatLevel(alertStats);
  
  return (
    <div className="war-room-grid">
      {/* Components using live data */}
    </div>
  );
}
```

#### 7.3 Verification Checklist

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Page compiles | `cd frontend && npx tsc --noEmit` | No errors |
| Hooks imported | Read page.tsx | useFlows, useAlerts, useWebSocket |
| Live data | Open `/war-room` | Data updates automatically |
| WebSocket events | Check browser console | Events received |
| MetricCards | Verify props | Connected to flowStats |
| ProtocolChart | Verify props | Connected to protocols |
| TrafficTimeline | Verify props | Connected to flowStats |
| LiveAlertFeed | Verify props | Connected to lastAlertEvent |
| TopTalkers | Verify props | Connected to topTalkers |
| ThreatLevel | Verify props | Connected to alertStats |

#### 7.4 Implementation Requirements

**Components to Update:**
- [ ] MetricCard components (4 cards) — connect to flowStats
- [ ] ProtocolChart — connect to protocols data
- [ ] TrafficTimeline — connect to flowStats with 1m interval
- [ ] LiveAlertFeed — connect to WebSocket lastAlertEvent
- [ ] TopTalkers — connect to topTalkers data
- [ ] ThreatLevel gauge — connect to alertStats

**Data Flow:**
1. useFlows hook fetches flow data every 3s
2. useAlerts hook fetches alert data every 5s
3. useWebSocket receives real-time events
4. War Room page combines all data sources
5. Components receive live data as props

---

### TASK 8 — Week 1 Demo Verification 🔴

**Time Est:** 15 min | **Priority:** 🔴 Critical  
**Reference:** MASTER_DOC_PART5 §3 (Week 1 Demo Requirements)

#### 8.1 Week 1 Demo Checklist

**"End of Week 1 Demo: Empty but beautiful dark dashboard shell, API docs visible at `/docs`, database tables exist."**

| Requirement | Verification | Expected |
|-------------|--------------|----------|
| Dark dashboard shell | Open `http://localhost:3000` | Dark theme, sidebar visible |
| API docs visible | Open `http://localhost:8000/docs` | Swagger UI with all endpoints |
| Database tables exist | `docker-compose exec postgres psql -U threatmatrix -c "\dt"` | 10 tables |
| Redis connected | `docker-compose exec redis redis-cli ping` | PONG |
| Backend running | `curl http://localhost:8000/api/v1/system/health` | `{"status":"operational"}` |
| Frontend running | `curl http://localhost:3000` | HTTP 200 |
| Navigation works | Click sidebar icons | Routes change |
| War Room loads | Open `/war-room` | Components render |

#### 8.2 Service Status Matrix

| Service | Port | Health Check | Expected |
|---------|------|--------------|----------|
| PostgreSQL | 5432 | `pg_isready` | accepting connections |
| Redis | 6379 | `redis-cli ping` | PONG |
| Backend | 8000 | `/api/v1/system/health` | `{"status":"operational"}` |
| Frontend | 3000 | Browser | Page loads with dark theme |

#### 8.3 Verification Commands

```bash
# 1. Check all containers are up
docker-compose ps

# 2. Verify backend health
curl http://localhost:8000/api/v1/system/health

# 3. Verify frontend accessible
curl http://localhost:3000

# 4. Verify API docs accessible
curl http://localhost:8000/docs

# 5. Verify database tables
docker-compose exec postgres psql -U threatmatrix -c "\dt"

# 6. Verify Redis connected
docker-compose exec redis redis-cli ping
```

#### 8.4 Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| All containers up | `docker-compose ps` | 2 containers healthy |
| Backend healthy | `curl /api/v1/system/health` | Operational |
| Frontend accessible | `curl localhost:3000` | HTTP 200 |
| API docs accessible | `curl localhost:8000/docs` | HTTP 200 |
| Database tables | `psql -c "\dt"` | 10 tables |
| Redis connected | `redis-cli ping` | PONG |

---

## 📁 Files to Verify/Modify

```
threatmatrix-ai/
├── frontend/
│   ├── hooks/
│   │   ├── useWebSocket.ts              🔨 TASK 4 (verify/update)
│   │   ├── useFlows.ts                  🔨 TASK 5 (verify/update)
│   │   └── useAlerts.ts                 🔨 TASK 6 (verify/update)
│   └── app/
│       └── war-room/
│           └── page.tsx                 🔨 TASK 7 (update)
└── docs/
    └── plans/
        └── DAY_06_TASKS_4_8_PLAN.md     🔨 This file
```

---

## 🎯 Execution Order

### Phase 1: Hook Verification (Tasks 4, 5, 6)
1. **Task 4** — Verify useWebSocket hook (30 min)
   - Check hook exports and TypeScript compilation
   - Verify auto-connect and reconnection logic
   - Test channel subscription management
   - Validate event parsing

2. **Task 5** — Verify useFlows hook (20 min)
   - Check hook exports and TypeScript compilation
   - Verify API integration with api.ts client
   - Test auto-refresh (3s interval)
   - Validate pagination and filtering

3. **Task 6** — Verify useAlerts hook (20 min)
   - Check hook exports and TypeScript compilation
   - Verify API integration with api.ts client
   - Test auto-refresh (5s interval)
   - Validate status updates and filtering

### Phase 2: War Room Integration (Task 7)
4. **Task 7** — Connect War Room components to live data (45 min)
   - Import hooks into war-room/page.tsx
   - Connect MetricCards to flowStats
   - Connect ProtocolChart to protocols data
   - Connect TrafficTimeline to flowStats
   - Connect LiveAlertFeed to WebSocket events
   - Connect TopTalkers to topTalkers data
   - Connect ThreatLevel to alertStats

### Phase 3: Demo Verification (Task 8)
5. **Task 8** — Week 1 demo verification (15 min)
   - Run all verification commands
   - Check all services are running
   - Verify dark dashboard shell
   - Verify API docs accessible
   - Verify database tables exist
   - Verify Redis connected

---

## ✅ Success Criteria

### Task 4 Success
- [ ] useWebSocket hook exports correctly
- [ ] TypeScript compiles without errors
- [ ] Auto-connect on mount with JWT token
- [ ] Reconnection with exponential backoff
- [ ] Channel subscription management works
- [ ] Event parsing handles all event types

### Task 5 Success
- [ ] useFlows hook exports correctly
- [ ] TypeScript compiles without errors
- [ ] API integration uses api.ts client
- [ ] Auto-refresh every 3 seconds
- [ ] Pagination and filtering work
- [ ] Loading and error states handled

### Task 6 Success
- [ ] useAlerts hook exports correctly
- [ ] TypeScript compiles without errors
- [ ] API integration uses api.ts client
- [ ] Auto-refresh every 5 seconds
- [ ] Status updates work with PATCH requests
- [ ] Severity and status filtering work

### Task 7 Success
- [ ] War Room page compiles without errors
- [ ] All hooks imported correctly
- [ ] MetricCards display live flow data
- [ ] ProtocolChart displays live protocol data
- [ ] TrafficTimeline displays live traffic data
- [ ] LiveAlertFeed displays real-time alerts
- [ ] TopTalkers displays live IP data
- [ ] ThreatLevel displays live alert stats

### Task 8 Success
- [ ] All Docker containers running
- [ ] Backend health check returns operational
- [ ] Frontend accessible at localhost:3000
- [ ] API docs accessible at localhost:8000/docs
- [ ] Database has 10 tables
- [ ] Redis responds with PONG
- [ ] Dark dashboard shell visible
- [ ] Navigation works between modules

---

## 🚨 Known Issues & Blockers

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| Next.js 16 build error (`workUnitAsyncStorage`) | 🟡 Medium | Open | `npm run dev` works. Build fails on static error pages. |
| Frontend hooks may be stubs | 🟡 Medium | Open | Need verification of actual API integration |
| War Room data connection not verified | 🟡 Medium | Open | Task 7 not completed |

---

## 📊 Timeline Health

### Week 1 Completion Status

| Deliverable | Status |
|-------------|--------|
| Project init: monorepo, Docker Compose, CI | ✅ Done |
| PostgreSQL schema + Alembic migrations | ✅ Done |
| FastAPI skeleton: auth, health, CORS, OpenAPI | ✅ Done |
| Next.js 16 init: layout, sidebar, theme, CSS vars | ✅ Done |
| Redis setup + pub/sub test | ✅ Done |
| Design system: colors, typography, GlassPanel | ✅ Done |
| Flow Service (Task 1) | ✅ Done |
| Alert Service (Task 2) | ✅ Done |
| WebSocket Server (Task 3) | ✅ Done |
| useWebSocket hook (Task 4) | 📋 Pending |
| useFlows hook (Task 5) | 📋 Pending |
| useAlerts hook (Task 6) | 📋 Pending |
| War Room API integration (Task 7) | 📋 Pending |
| Week 1 demo verification (Task 8) | 📋 Pending |

### Version Milestone Check

| Version | Content | Target Date | Status |
|---------|---------|-------------|--------|
| `v0.1.0` | Project skeleton, DB, auth, UI shell | Week 1 (Mar 2) | ✅ On track |
| `v0.2.0` | Capture engine, flow storage, War Room layout | Week 2 (Mar 9) | 📋 Next |

---

## 🔗 Reference Documents

| Document | Path | Purpose |
|----------|------|---------|
| Day 6 Worklog | `docs/worklog/DAY_06_MAR02.md` | Task specifications |
| Master Doc Part 2 | `docs/master-documentation/MASTER_DOC_PART2_ARCHITECTURE.md` | API endpoints, DB schema |
| Master Doc Part 3 | `docs/master-documentation/MASTER_DOC_PART3_MODULES.md` | War Room components, UI/UX |
| Master Doc Part 5 | `docs/master-documentation/MASTER_DOC_PART5_TIMELINE.md` | Week-by-week plan, hooks spec |
| Session Handoff | `docs/SESSION_HANDOFF.md` | Current project state |
| Overall Progress | `docs/worklog/overall_progress_report.md` | Audit report |

---

*Plan created: March 20, 2026*  
*Next review: After Task 8 completion*
