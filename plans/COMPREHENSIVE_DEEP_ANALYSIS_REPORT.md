# ThreatMatrix AI — Comprehensive Deep-Dive Analysis Report

> **Date**: 2026-03-23  
> **Scope**: Full-stack codebase, documentation, integration contracts, progress assessment  
> **Files Analyzed**: 50+ across backend, frontend, docs, plans  

---

## Table of Contents

1. [Project Progress Overview](#1-project-progress-overview)
2. [CRITICAL Severity Issues](#2-critical-severity-issues)
3. [HIGH Severity Issues](#3-high-severity-issues)
4. [MEDIUM Severity Issues](#4-medium-severity-issues)
5. [LOW Severity Issues](#5-low-severity-issues)
6. [Documentation Accuracy Assessment](#6-documentation-accuracy-assessment)
7. [Integration Progress Matrix](#7-integration-progress-matrix)

---

## 1. Project Progress Overview

### What Is Fully Implemented ✅

| Layer | Component | Status |
|-------|-----------|--------|
| **Backend** | FastAPI application factory with CORS, lifespan | ✅ Fully working |
| **Backend** | PostgreSQL async DB via SQLAlchemy + Alembic migrations | ✅ 10 models migrated |
| **Backend** | Redis connection + pub/sub manager | ✅ Connected |
| **Backend** | JWT auth service (register, login, refresh, logout) | ✅ Full RBAC |
| **Backend** | Auth API routes (`/api/v1/auth/*`) | ✅ 5 endpoints wired |
| **Backend** | Flow API routes (`/api/v1/flows/*`) | ✅ 6 endpoints with DB queries |
| **Backend** | Alert API routes (`/api/v1/alerts/*`) | ✅ 5 endpoints with DB queries |
| **Backend** | System API routes (`/api/v1/system/*`) | ✅ 2 endpoints |
| **Backend** | Capture API routes (`/api/v1/capture/*`) | ✅ 4 endpoints (start/stop/status/interfaces) |
| **Backend** | WebSocket server with Redis pub/sub bridge | ✅ Working |
| **Backend** | Flow consumer (Redis → PostgreSQL persistence) | ✅ Working |
| **Backend** | DEV_MODE auth bypass | ✅ Working |
| **Frontend** | Login page with JWT auth flow | ✅ Working |
| **Frontend** | API client with JWT refresh + retry | ✅ Working |
| **Frontend** | WebSocket singleton client with reconnect | ✅ Working |
| **Frontend** | War Room page with live widgets | ✅ UI complete |
| **Frontend** | Alert Console page with `useAlerts` hook | ✅ Wired to backend |
| **Frontend** | Network Flow page | ✅ UI complete |
| **Frontend** | Service layer (`lib/services.ts`) | ✅ Alert + Flow services |
| **Frontend** | Type definitions (`lib/types.ts`) | ✅ Comprehensive types |
| **Frontend** | Utility functions (`lib/utils.ts`) | ✅ Formatting helpers |
| **Frontend** | Constants (`lib/constants.ts`) | ✅ Colors, intervals, nav |
| **Frontend** | Shared components (DataTable, EmptyState, etc.) | ✅ 6 components |
| **Frontend** | War Room components (8 widgets) | ✅ All implemented |

### What Is Partially Complete ⚠️

| Layer | Component | Status |
|-------|-----------|--------|
| **Backend** | Alert service — fully queries DB but `_alert_counter` resets on restart | ⚠️ Counter not persisted |
| **Backend** | System health — DB health returns `"pending"` (hardcoded) | ⚠️ No actual DB ping |
| **Frontend** | `useFlows` hook — wired but response shape mismatches | ⚠️ Broken contracts |
| **Frontend** | `useAlerts` hook — wired but local `Alert` interface diverges from backend | ⚠️ Type mismatch |
| **Frontend** | WebSocket hook — connects but never sends `subscribe` action to backend | ⚠️ No channel subscription |
| **Frontend** | Intel page (`/intel`) | ⚠️ UI exists, no backend |
| **Frontend** | Admin page (`/admin`) | ⚠️ Static cards only |

### What Is Unstarted 🔴

| Layer | Component | Status |
|-------|-----------|--------|
| **Backend** | Intel API routes (`/api/v1/intel/*`) | 🔴 Models exist, no routes |
| **Backend** | ML Ops API routes (`/api/v1/ml/*`) | 🔴 Models exist, no routes |
| **Backend** | LLM Chat API routes (`/api/v1/llm/*`) | 🔴 No routes at all |
| **Backend** | PCAP upload API routes (`/api/v1/pcap/*`) | 🔴 No routes |
| **Backend** | Report generation API | 🔴 No routes |
| **Backend** | Admin/user management API | 🔴 No routes |
| **Backend** | Audit logging API | 🔴 No routes |
| **Backend** | Rate limiting middleware | 🔴 Not implemented |
| **Backend** | Token blacklisting for logout | 🔴 Stateless logout only |
| **Frontend** | Threat Hunt page (`/hunt`) | 🔴 Referenced in nav, no page file found |
| **Frontend** | AI Analyst page (`/ai-analyst`) | 🔴 Referenced in nav, no page file found |
| **Frontend** | Forensics Lab page (`/forensics`) | 🔴 Referenced in nav, no page file found |
| **Frontend** | ML Operations page (`/ml-ops`) | 🔴 Referenced in nav, no page file found |
| **Frontend** | Reports page (`/reports`) | 🔴 Referenced in nav, no page file found |
| **Frontend** | Auth guard / protected route wrapper | 🔴 No route protection |
| **Frontend** | Test suite | 🔴 Zero tests |

---

## 2. CRITICAL Severity Issues

### CRIT-01: Frontend-Backend Response Shape Mismatch — `useFlows` Hook

**Files**: [`useFlows.ts`](frontend/hooks/useFlows.ts:92) vs [`flow_service.py`](backend/app/services/flow_service.py:251)

The `useFlows` hook expects **completely different response shapes** than what the backend actually returns. This causes **silent data loss** — the hook succeeds but sets empty/wrong state.

**Protocol distribution mismatch:**
```typescript
// useFlows.ts:100 — Frontend expects:
api.get<ProtocolStats[]>('/api/v1/flows/protocols')
// Expects: [{protocol: "TCP", count: 100, percent: 50}, ...]
```
```python
# flow_service.py:354-358 — Backend returns:
{
    "protocols": {"TCP": {"count": 100, "percentage": 50.0}},
    "total_flows": 200,
    "period": "1h"
}
```

**Top talkers mismatch:**
```typescript
// useFlows.ts:99 — Frontend expects:
api.get<TopTalker[]>('/api/v1/flows/top-talkers')
// Expects: [{ip: "...", bytes_total: 100, flow_count: 5, is_anomalous: false}, ...]
```
```python
# flow_service.py:306-310 — Backend returns:
{
    "top_talkers": [{ip, flow_count, total_bytes, total_packets, anomaly_count}],
    "period": "1h",
    "total_talkers": 10
}
```

**Stats endpoint mismatch:**
```typescript
// useFlows.ts:98 — Frontend expects:
api.get<FlowStats[]>('/api/v1/flows/stats', { interval: '1m' })
// Expects array of: [{timestamp, packets_per_second, bytes_per_second, active_flows, anomaly_count}]
```
```python
# flow_service.py:251-262 — Backend returns a SINGLE object:
{
    "interval": "1h",
    "total_flows": 500,
    "anomaly_count": 10,
    "anomaly_percentage": 2.0,
    "protocol_distribution": {...},
    "top_source_ips": [...]
}
```

**Why it matters**: The War Room page depends on `stats` being an **array** to iterate and compute `packets_per_second` / `anomaly_count` (line 48-55 of [`war-room/page.tsx`](frontend/app/war-room/page.tsx:48)). The backend returns a single aggregate object with completely different field names. Every metric card will show **0** or **NaN**.

**Recommendation**: The `useFlows` hook, `flowService`, and the War Room page components must be updated to match the actual backend response shapes. Either:
1. Transform the backend response in the service layer to match the frontend interfaces, OR
2. Update the frontend interfaces to match the backend response shapes

---

### CRIT-02: WebSocket Never Subscribes to Backend Channels

**Files**: [`useWebSocket.ts`](frontend/hooks/useWebSocket.ts:119) + [`websocket.ts`](frontend/lib/websocket.ts:46)

The frontend WebSocket client **connects** to the backend and **locally subscribes listeners** to channels, but **never sends the `subscribe` action message** to the backend WebSocket server.

```typescript
// websocket.ts:46 — Client connects:
const url = `${WS_BASE_URL}/ws/?token=${token}`;
this.ws = new WebSocket(url);
```

```typescript
// useWebSocket.ts:121 — Subscribes LOCALLY only:
const unsubFlows = wsClient.subscribe(WS_CHANNELS.FLOWS, (d) => setLastFlowEvent(d as FlowEvent));
```

But the backend WebSocket server at [`websocket.py`](backend/app/api/v1/websocket.py:224) requires the client to **send a JSON message** to actually subscribe:
```python
# websocket.py:284-287 — Backend expects:
# Client must send: {"action": "subscribe", "channels": ["flows:live", "alerts:live"]}
if action == "subscribe":
    channels = message.get("channels", [])
    result = await manager.subscribe(websocket, channels)
```

Without sending `{"action": "subscribe", ...}`, the backend's `ConnectionManager` never adds the WebSocket to any `channel_subscribers` set. **No real-time events will ever reach the frontend.**

**Why it matters**: The entire War Room real-time experience is broken. Live alert feed, flow events, system status — none of these will receive WebSocket push events.

**Recommendation**: After WebSocket `onopen`, the client must send:
```json
{"action": "subscribe", "channels": ["flows:live", "alerts:live", "system:status"]}
```

---

### CRIT-03: Alert Service Frontend-Backend Contract Broken — Wrong Endpoint Path for Status Update

**Files**: [`services.ts`](frontend/lib/services.ts:50) vs [`alerts.py`](backend/app/api/v1/alerts.py:77)

The frontend alert service sends status updates to the **wrong endpoint** with the **wrong payload format**:

```typescript
// services.ts:50-51 — Frontend sends:
async updateStatus(id: string, status: string) {
    return api.patch<AlertResponse>(`/api/v1/alerts/${id}`, { status });
}
```

But the backend expects:
```python
# alerts.py:77-84 — Backend endpoint is:
@router.patch("/{alert_id}/status")
async def update_alert_status(
    alert_id: str = Path(...),
    body: StatusUpdateRequest = ...,  # expects {"new_status": "...", "resolution_note": "..."}
)
```

**Two problems**:
1. **Wrong URL**: Frontend sends to `/api/v1/alerts/{id}` but backend expects `/api/v1/alerts/{id}/status`
2. **Wrong body**: Frontend sends `{"status": "..."}` but backend expects `{"new_status": "...", "resolution_note": "..."}`

Similarly, the `assign` method calls a non-existent generic PATCH:
```typescript
// services.ts:55-56
async assign(id: string, userId: string) {
    return api.patch<AlertResponse>(`/api/v1/alerts/${id}`, { assigned_to: userId });
}
```
Backend expects: `PATCH /api/v1/alerts/{id}/assign` with `{"assignee_id": "uuid"}`

**Why it matters**: Every alert status update and assignment will silently fail with a 404 or 405 error.

**Recommendation**: Fix the service URLs and payload shapes to match the backend:
```typescript
updateStatus: (id, status, note?) => api.patch(`/api/v1/alerts/${id}/status`, { new_status: status, resolution_note: note })
assign: (id, userId) => api.patch(`/api/v1/alerts/${id}/assign`, { assignee_id: userId })
```

---

### CRIT-04: `useAlerts` Hook Has Duplicate `Alert` Interface That Diverges from Backend

**Files**: [`useAlerts.ts`](frontend/hooks/useAlerts.ts:12) vs [`alert_service.py`](backend/app/services/alert_service.py:113)

The `useAlerts` hook defines its own `Alert` interface with fields that **don't exist** in the backend response:

```typescript
// useAlerts.ts:12-28 — Hook defines:
export interface Alert {
  id: string;
  severity: Severity;
  category: string;         // Backend returns this
  src_ip: string;            // Backend: "source_ip" (different key name!)
  dst_ip: string;            // Backend: "dest_ip" (different key name!)
  src_port?: number;         // Backend: doesn't return port in list view
  dst_port?: number;         // Backend: doesn't return port in list view
  composite_score: number;   // ❌ Backend: "confidence" (different key!)
  label: string;             // ❌ Backend: no "label" field on alerts
  status: AlertStatus;
  assigned_to?: string;
  ai_narrative?: string;
  flow_count: number;        // ❌ Backend: no "flow_count" field
  timestamp: string;         // Backend: "created_at" (different key!)
  updated_at: string;        // Backend: this can be null
}
```

The backend [`alert_service.py:113-136`](backend/app/services/alert_service.py:113) returns:
```python
{
    "id": ...,
    "alert_id": ...,           # ← not in frontend type
    "severity": ...,
    "title": ...,              # ← not in frontend type
    "description": ...,
    "category": ...,
    "source_ip": ...,          # != "src_ip"
    "dest_ip": ...,            # != "dst_ip"
    "confidence": ...,         # != "composite_score"
    "status": ...,
    "assigned_to": ...,
    "ml_model": ...,
    "ai_narrative": ...,
    "created_at": ...,         # != "timestamp"
    "resolved_at": ...,
}
```

**Why it matters**: When real alerts come from the backend, every field access for `src_ip`, `dst_ip`, `composite_score`, `label`, `flow_count`, and `timestamp` will be `undefined`. The entire Alert Console will display broken/empty data.

**Recommendation**: The `Alert` interface in `useAlerts.ts` must be replaced with the centralized `AlertResponse` type from [`types.ts`](frontend/lib/types.ts:11), and field mappings must be corrected.

---

### CRIT-05: Frontend `flowService.search()` Uses GET Instead of POST

**Files**: [`services.ts`](frontend/lib/services.ts:120) vs [`flows.py`](backend/app/api/v1/flows.py:91)

```typescript
// services.ts:120 — Frontend uses GET:
async search(query: FlowFilters) {
    return api.get<PaginatedResponse<FlowResponse>>('/api/v1/flows/search', params);
}
```

```python
# flows.py:91 — Backend expects POST:
@router.post("/search")
async def search_flows(...)
```

**Why it matters**: Every search request will return a **405 Method Not Allowed** error.

**Recommendation**: Change `api.get` to `api.post` in the flow search service method.

---

### CRIT-06: `useFlows` Hook Protocol Type Mismatch — `string` vs `int`

**Files**: [`useFlows.ts`](frontend/hooks/useFlows.ts:17) vs [`flow_service.py`](backend/app/services/flow_service.py:101)

```typescript
// useFlows.ts:17 — Frontend interface:
protocol: string;  // Expects "TCP", "UDP", "ICMP"
```

```python
# flow_service.py:101 — Backend returns:
"protocol": flow.protocol,  # Returns integer: 6, 17, 1
```

All protocol-based filtering and display will break. The filter input in `useFlows.ts:60` is also typed as `string`:
```typescript
// useFlows.ts:60
protocol?: string;  // But backend expects int
```

**Why it matters**: Protocol values will display as raw numbers (6, 17, 1) instead of human-readable names, and frontend filtering by protocol name string will never match.

**Recommendation**: Add protocol mapping utility and transform in the service layer or hook.

---

## 3. HIGH Severity Issues

### HIGH-01: No Route Protection / Auth Guard on Frontend Pages

**Files**: All pages in [`frontend/app/`](frontend/app/)

There is **no authentication guard** on any frontend page. All pages (War Room, Alerts, Network, Admin, etc.) are freely accessible without being logged in. The login page exists and stores tokens, but no middleware or layout wrapper checks for them.

```typescript
// war-room/page.tsx — No auth check whatsoever:
export default function WarRoomPage() {
  const { lastAlertEvent, systemStatus } = useWebSocket();
  // ... renders directly
}
```

**Why it matters**: Any unauthenticated user can navigate directly to `/war-room`, `/alerts`, `/admin` etc. and see the UI (though API calls will return 401 errors with DEV_MODE off).

**Recommendation**: Create an `AuthGuard` layout wrapper that checks for `tm_access_token` in localStorage and redirects to `/login` if missing.

---

### HIGH-02: `DEV_MODE = True` Bypasses All Authentication — Security Risk

**Files**: [`config.py`](backend/app/config.py:18) + [`dependencies.py`](backend/app/dependencies.py:78)

```python
# config.py:18-21
DEV_MODE: bool = Field(
    default=True,
    description="Enable dev auth bypass — disable in production!"
)

# dependencies.py:78-79
if settings.DEV_MODE:
    return _get_dev_user()
```

**Why it matters**: `DEV_MODE` defaults to `True`, meaning **all authenticated endpoints are completely bypassed** by default. The WebSocket endpoint also validates tokens via [`validate_token()`](backend/app/api/v1/websocket.py:202), but in DEV_MODE the token validation still checks JWT — it does NOT use DEV_MODE bypass. This creates an **inconsistency** where REST APIs work without auth but WebSocket requires a real token.

**Recommendation**: 
1. Ensure `DEV_MODE` is `False` by default, set via `.env` only
2. Add DEV_MODE bypass to WebSocket token validation for consistency
3. Add prominent startup warning log when DEV_MODE is active

---

### HIGH-03: `api.upload()` Sets Content-Type to `application/json` Breaking File Uploads

**Files**: [`api.ts`](frontend/lib/api.ts:122)

```typescript
// api.ts:122-127
upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return apiFetch<T>(path, { method: 'POST', body: formData, headers });
}
```

The `apiFetch` function at [`api.ts:56-58`](frontend/lib/api.ts:56) **always adds** `Content-Type: application/json`:
```typescript
const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
};
```

Since the upload's custom headers don't include `Content-Type`, the spread will keep `application/json` from the default. For `FormData` uploads, the browser **must set** `Content-Type: multipart/form-data` with the boundary automatically. Explicitly setting `application/json` will **break** all file uploads.

**Why it matters**: PCAP file uploads (when the backend route is built) will fail with parsing errors.

**Recommendation**: Skip `Content-Type` header when body is `FormData`:
```typescript
if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
}
```

---

### HIGH-04: Frontend `FlowResponse` Type in `types.ts` Diverges from Backend

**Files**: [`types.ts`](frontend/lib/types.ts:36) vs [`flow_service.py`](backend/app/services/flow_service.py:92)

```typescript
// types.ts:36-53 — Frontend FlowResponse:
export interface FlowResponse {
  id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: number;
  bytes_sent: number;         // ❌ Backend: "src_bytes"
  bytes_received: number;     // ❌ Backend: "dst_bytes"
  packets_sent: number;       // ❌ Backend: no such field
  packets_received: number;   // ❌ Backend: no such field
  start_time: string;         // ❌ Backend: "timestamp"
  end_time?: string;          // ❌ Backend: no such field
  duration_ms?: number;       // ❌ Backend: "duration" (seconds, not ms)
  flags?: string;             // ❌ Backend: no such field
  label?: string;
  score?: number;             // ❌ Backend: "anomaly_score"
}
```

Backend returns per [`flow_service.py:92-118`](backend/app/services/flow_service.py:92):
```python
{
    "id", "timestamp", "src_ip", "dst_ip", "src_port", "dst_port",
    "protocol",  # int
    "duration",  # float seconds
    "total_bytes", "total_packets", "src_bytes", "dst_bytes",
    "anomaly_score", "is_anomaly", "ml_model", "label", "source", "created_at"
}
```

**Why it matters**: All flow data displayed on the Network Flow page will have wrong/missing values for bytes, packets, timestamps, and anomaly scores.

**Recommendation**: Update `FlowResponse` to match backend field names exactly.

---

### HIGH-05: `SystemHealth` Frontend Type Doesn't Match Backend Response

**Files**: [`types.ts`](frontend/lib/types.ts:187) vs [`system.py`](backend/app/api/v1/system.py:37)

```typescript
// types.ts:187-203 — Frontend expects:
export interface SystemHealth {
  status: SystemStatus;         // 'healthy' | 'degraded' | 'unhealthy'
  version: string;
  uptime: number;               // ❌ Backend doesn't return uptime
  services: Record<string, {    // ❌ Backend returns "components", not "services"
    status: SystemStatus;
    latency_ms?: number;
    last_check: string;
  }>;
  metrics?: { cpu_percent, memory_percent, disk_percent, active_connections };  // ❌ Not returned
  timestamp: string;
}
```

Backend returns:
```python
# system.py:37-52
{
    "status": "operational" | "degraded",  # Different values than frontend type
    "service": "ThreatMatrix AI",
    "version": "0.1.0",
    "timestamp": "...",
    "components": {
        "api": "healthy",
        "database": "pending",
        "redis": {"status": "...", "latency_ms": ...},
        "capture_engine": "idle",
        "ml_worker": "idle",
    }
}
```

**Why it matters**: The `useSystemHealth` hook and Admin page will fail to display any meaningful health data.

---

### HIGH-06: Alert Stats Response Shape Mismatch

**Files**: [`types.ts`](frontend/lib/types.ts) (integration plan doc line 171) vs [`alert_service.py`](backend/app/services/alert_service.py:257)

The integration plan document defines `AlertStatsResponse` with fields like `total_alerts`, `open_count`, `severity_distribution`. But the actual backend returns:
```python
# alert_service.py:257-263
{
    "time_range": "24h",
    "total": 42,          # Not "total_alerts"
    "by_severity": {...},   # Not "severity_distribution"
    "by_status": {...},     # Not individual "*_count" fields
    "by_category": {...}    # Not "category_distribution"
}
```

The frontend `AlertStatsResponse` type doesn't exist in the actual [`types.ts`](frontend/lib/types.ts) file — it's only defined in the integration plan document, not implemented.

---

### HIGH-07: Non-Existent Frontend Service Methods Call Non-Existent Backend Endpoints

**Files**: [`services.ts`](frontend/lib/services.ts:65)

Several alert service methods reference endpoints that **don't exist** on the backend:

```typescript
// services.ts:65-77
async addNote(id: string, note: string) {
    return api.post(`/api/v1/alerts/${id}/notes`, { note });  // ❌ No such endpoint
}
async bulkAcknowledge(ids: string[]) {
    return api.post('/api/v1/alerts/bulk/acknowledge', { ids });  // ❌ No such endpoint
}
async bulkResolve(ids: string[]) {
    return api.post('/api/v1/alerts/bulk/resolve', { ids });  // ❌ No such endpoint
}
async markFalsePositive(id: string) {
    return api.patch(`/api/v1/alerts/${id}`, { status: 'false_positive' });  // ❌ Wrong endpoint
}
```

And flow service methods that don't exist:
```typescript
// services.ts:144-158
async getTimeline(...) {
    return api.get('/api/v1/flows/timeline', ...);  // ❌ No such endpoint
}
async getByIP(ip: string, ...) {
    return api.get('/api/v1/flows', { ip, ... });  // ❌ "ip" not a valid query param
}
```

---

### HIGH-08: `useFlows` Hook Bypasses Service Layer — Uses `api` Directly

**Files**: [`useFlows.ts`](frontend/hooks/useFlows.ts:9) vs [`services.ts`](frontend/lib/services.ts:87)

```typescript
// useFlows.ts:9 — Imports api directly:
import { api } from '@/lib/api';

// useFlows.ts:93-101 — Calls API directly, ignoring the service layer:
api.get<{ items: NetworkFlow[]; total: number }>('/api/v1/flows', {...}),
api.get<FlowStats[]>('/api/v1/flows/stats', { interval: '1m' }),
api.get<TopTalker[]>('/api/v1/flows/top-talkers'),
api.get<ProtocolStats[]>('/api/v1/flows/protocols'),
```

While `useAlerts` correctly uses `alertService`, `useFlows` bypasses the `flowService` entirely. The service layer in [`services.ts`](frontend/lib/services.ts:87) has proper typed `flowService` methods that go unused.

**Why it matters**: Two different type contracts exist for the same endpoints, making changes error-prone and duplicating bug surfaces.

**Recommendation**: Refactor `useFlows` to consume `flowService` from `services.ts`.

---

## 4. MEDIUM Severity Issues

### MED-01: Alert ID Counter Resets on Server Restart

**File**: [`alert_service.py`](backend/app/services/alert_service.py:18)

```python
_alert_counter = 0

def _generate_alert_id() -> str:
    global _alert_counter
    _alert_counter += 1
    return f"TM-ALERT-{_alert_counter:05d}"
```

**Why it matters**: After a server restart, new alerts will start at `TM-ALERT-00001` again, potentially creating duplicate human-readable IDs.

**Recommendation**: Query `MAX(alert_id)` from the DB on startup, or use a database sequence.

---

### MED-02: System Health Endpoint Returns Hardcoded `"pending"` for Database Status

**File**: [`system.py`](backend/app/api/v1/system.py:44)

```python
"database": "pending",     # TODO: actual DB ping
```

**Why it matters**: The health endpoint can never report database failures; it always says "pending".

**Recommendation**: Add an actual DB health check query (`SELECT 1`).

---

### MED-03: `useFlows` Passes Entire `filters` Object as Dependency to `useCallback`

**File**: [`useFlows.ts`](frontend/hooks/useFlows.ts:122)

```typescript
const fetchAll = useCallback(async () => {
    // ...
}, [filters]); // ← Object reference changes every render!
```

Since `filters` is an object (reference type), it creates a **new reference every render**, causing `fetchAll` to be recreated every render. Combined with the `useEffect` depending on `fetchAll`, this creates an **infinite re-render loop** that triggers API calls non-stop (on top of the 3-second interval).

**Why it matters**: Massive performance degradation — the browser will hammer the backend with requests.

**Recommendation**: Destructure filter values and use them individually as dependencies:
```typescript
const { src_ip, dst_ip, protocol, time_range, min_score, label, page, limit } = filters;
const fetchAll = useCallback(async () => { ... }, [src_ip, dst_ip, protocol, ...]);
```

---

### MED-04: Environment Variables Not Centralized — Backend `.env` Not in Source Control

**Files**: [`config.py`](backend/app/config.py:71), [`.gitignore`](backend/.gitignore)

The backend config loads from `.env` but there's no `.env.example` or `.env.template` in the repo. New developers must guess all required environment variables from reading `config.py`.

**Recommendation**: Create a `.env.example` with all variables (masked secrets).

---

### MED-05: WebSocket URL Mismatch — Path Prefix

**Files**: [`websocket.ts`](frontend/lib/websocket.ts:49) vs [`websocket.py`](backend/app/api/v1/websocket.py:223)

```typescript
// Frontend:
const url = `${WS_BASE_URL}/ws/?token=${token}`;
// Constructs: ws://localhost:8000/ws/?token=...
```

```python
# Backend (websocket.py:223):
@router.websocket("/ws/")
# Mounted under: /api/v1 (from __init__.py:22 without prefix)
# Actually available at: ws://localhost:8000/api/v1/ws/?token=...
```

Wait — examining [`__init__.py`](backend/app/api/v1/__init__.py:22):
```python
router.include_router(websocket_router, tags=["WebSocket"])
# No prefix! So it's at /api/v1/ws/
```

But `settings.API_V1_PREFIX = "/api/v1"`, so the full path is `ws://localhost:8000/api/v1/ws/?token=...`.

The frontend connects to `ws://localhost:8000/ws/?token=...` — **missing the `/api/v1` prefix**.

**Why it matters**: WebSocket connection will fail with a 404, and the auto-reconnect will loop endlessly.

**Recommendation**: Update frontend to: `${WS_BASE_URL}/api/v1/ws/?token=${token}`

---

### MED-06: Backend `alert_service.update_alert_status` Has Logic Bug — Returns Old Status

**File**: [`alert_service.py`](backend/app/services/alert_service.py:322)

```python
# alert_service.py:322-327
return {
    "alert_id": alert.alert_id,
    "previous_status": alert.status,  # ← After refresh, this is the NEW status
    "new_status": new_status,
    "updated_at": alert.updated_at.isoformat(),
}
```

The `await db.refresh(alert)` on line 320 reloads the alert, so `alert.status` is now the **new** status, not the previous one. Both `previous_status` and `new_status` will be the same value.

**Recommendation**: Store the old status in a variable before the update: `old_status = alert.status`.

---

### MED-07: Duplicate Type Definitions Across Multiple Files

**Files**: [`useFlows.ts`](frontend/hooks/useFlows.ts:11), [`useAlerts.ts`](frontend/hooks/useAlerts.ts:12), [`types.ts`](frontend/lib/types.ts)

Both hooks define their own local interfaces (`NetworkFlow`, `Alert`, `FlowStats`, `TopTalker`, `ProtocolStats`) that **diverge** from the centralized types in `types.ts`. Three different definitions exist for similar concepts:

| Concept | `types.ts` | `useFlows.ts` | `useAlerts.ts` |
|---------|-----------|---------------|----------------|
| Flow | `FlowResponse` | `NetworkFlow` | — |
| Alert | `AlertResponse` | — | `Alert` |
| Top Talker | `TopTalker` (bytes_total) | `TopTalker` (bytes_total) | — |
| Protocol | `ProtocolStats` | `ProtocolStats` | — |

**Recommendation**: Delete all local interface definitions from hooks; import from `types.ts`.

---

### MED-08: `useFlows.searchFlows()` Sends Body as JSON but Backend Expects Query Parameters

**File**: [`useFlows.ts`](frontend/hooks/useFlows.ts:125)

```typescript
// useFlows.ts:125
const { data, error: err } = await api.post<{ items: NetworkFlow[] }>('/api/v1/flows/search', query);
```

The `api.post()` serializes `query` as JSON body. But the backend's `POST /flows/search` endpoint uses **Query parameters**, not a request body:

```python
# flows.py:92-99
@router.post("/search")
async def search_flows(
    src_ip: Optional[str] = None,      # ← These are query params
    dst_ip: Optional[str] = None,
    protocol: Optional[int] = None,
    ...
)
```

**Why it matters**: All search parameters will be silently ignored; the backend will return unfiltered results.

**Recommendation**: Either change the backend to accept a request body, or change the frontend to send query params with a POST request.

---

## 5. LOW Severity Issues

### LOW-01: Frontend `flowService.getStats()` Uses Wrong Query Parameter Name

**File**: [`services.ts`](frontend/lib/services.ts:125)

```typescript
// services.ts:125
async getStats(timeRange: string = '1h') {
    return api.get('/api/v1/flows/stats', { time_range: timeRange });
}
```

Backend expects `interval`, not `time_range`:
```python
# flows.py:48
interval: str = Query("1h", pattern="^(5m|15m|1h|6h|24h)$"),
```

---

### LOW-02: Alert List Response Missing `alert_id` and `title` Fields in Frontend Type

**File**: [`types.ts`](frontend/lib/types.ts:11)

The `AlertResponse` in `types.ts` is missing `alert_id` (the human-readable ID like `TM-ALERT-00001`) and `title` — both of which the backend returns.

---

### LOW-03: Two Separate Color Constants for Severity

**File**: [`constants.ts`](frontend/lib/constants.ts:12)

```typescript
export const SEVERITY_COLORS: Record<Severity, string> = { /* ... */ };
export const SEVERITY_COLORS_EXACT: Record<Severity, string> = { /* ... */ };
```

Two nearly identical maps exist with a confusing comment about CSS matching. Only `SEVERITY_CSS_VARS` should be needed.

---

### LOW-04: Login Page is 1177 Lines — Excessive Single File Complexity

**File**: [`login/page.tsx`](frontend/app/login/page.tsx)

The login page combines canvas animations, star fields, shooting stars, radar pings, SVG overlays, CSS keyframe injection, and the login form — all in a single 1177-line file. This is difficult to maintain and test.

**Recommendation**: Extract into separate components: `StarFieldCanvas`, `RadarOverlay`, `LoginForm`.

---

### LOW-05: `useFlows` Sends Non-Standard `interval: '1m'` to Stats Endpoint

**File**: [`useFlows.ts`](frontend/hooks/useFlows.ts:98)

```typescript
api.get<FlowStats[]>('/api/v1/flows/stats', { interval: '1m' }),
```

The backend only accepts `^(5m|15m|1h|6h|24h)$` pattern. `'1m'` will fail validation with a 422 error.

---

### LOW-06: `useWebSocket` Hook Heartbeat Doesn't Actually Send Ping

**File**: [`useWebSocket.ts`](frontend/hooks/useWebSocket.ts:137)

```typescript
const heartbeatInterval = setInterval(() => {
    if (wsClient.isConnected) {
        // Send a ping message (backend should respond with pong)
        // For now, we just check connection state
        checkConnection();
    }
}, 30000);
```

The comment says it should send a ping, but it only checks state. No actual WebSocket ping/pong frames are sent.

---

### LOW-07: Backend `CORS_ORIGINS` Missing Common Dev Ports

**File**: [`config.py`](backend/app/config.py:66)

```python
CORS_ORIGINS: list[str] = [
    "http://localhost:3000",
    "https://threatmatrix-ai.vercel.app",
]
```

Missing `http://localhost:3001` (common with port conflicts) and `http://127.0.0.1:3000` (different from `localhost` in some browsers).

---

## 6. Documentation Accuracy Assessment

### Integration Plan Document Assessment

**File**: [`Backend-to-Frontend Integration Plan updated`](docs/Backend-to-Frontend Integration Plan updated)

| Section | Accuracy | Issues |
|---------|----------|--------|
| §1.1 Endpoints Table | ⚠️ **Partially Outdated** | Says alerts are "skeleton stubs" returning empty — but alert_service.py now has full DB queries. Capture routes exist but aren't listed. |
| §1.2 Database Schema | ✅ **Accurate** | All 10 models correctly documented |
| §1.3 Pydantic Schemas | ✅ **Accurate** | Schema listing matches `backend/app/schemas/` |
| §1.4 Backend→Frontend Mapping | ⚠️ **Partially Outdated** | References pages (hunt, forensics, ml-ops, reports, ai-analyst) that don't exist in actual frontend file tree. Doc says they have MOCK data but files aren't present. |
| §2.1 Execution Roadmap | ⚠️ **Not Yet Executed** | Proposes `frontend/lib/services/` directory structure but actual implementation is a single `frontend/lib/services.ts` file |
| §2.2 State Management | ✅ **Accurate** | Correctly describes hooks + useState pattern |
| Task 3 Code Snippets | ⚠️ **Partially Implemented** | Some service methods implemented in `services.ts` but with wrong endpoint paths |
| Summary Priority Table | ⚠️ **Outdated** | Alerts listed as "stubs" but now fully wired in backend |

### Key Documentation vs Code Discrepancies

1. **Doc says alerts return empty stubs** — but [`alert_service.py`](backend/app/services/alert_service.py) has full DB implementation
2. **Doc references `frontend/lib/services/` directory** — actual code uses single [`frontend/lib/services.ts`](frontend/lib/services.ts) file
3. **Doc references pages** (`hunt`, `forensics`, `ml-ops`, `reports`, `ai-analyst`) with mock data — these page files don't exist in the current file tree
4. **Doc says Capture has no routes** — but [`capture.py`](backend/app/api/v1/capture.py) exists with 4 endpoints
5. **Doc correctly identifies `protocol` int→string mapping issue** — this is confirmed in code and **still not fixed**

---

## 7. Integration Progress Matrix

```
┌─────────────────────┬──────────┬──────────┬──────────────┬───────────┐
│ Feature             │ Backend  │ Frontend │ Integration  │ Status    │
│                     │ API      │ UI       │ Contract     │           │
├─────────────────────┼──────────┼──────────┼──────────────┼───────────┤
│ Auth/Login          │ ✅       │ ✅       │ ✅ Working   │ DONE      │
│ System Health       │ ✅       │ ⚠️ Types │ ❌ Mismatched│ BROKEN    │
│ Flow List           │ ✅       │ ✅ UI    │ ❌ Mismatched│ BROKEN    │
│ Flow Stats          │ ✅       │ ✅ UI    │ ❌ Mismatched│ BROKEN    │
│ Flow Protocols      │ ✅       │ ✅ UI    │ ❌ Mismatched│ BROKEN    │
│ Flow Top Talkers    │ ✅       │ ✅ UI    │ ❌ Mismatched│ BROKEN    │
│ Flow Search         │ ✅       │ ✅ UI    │ ❌ GET vs POST│ BROKEN    │
│ Alert List          │ ✅       │ ✅ Hook  │ ❌ Field names│ BROKEN    │
│ Alert Update Status │ ✅       │ ✅ Hook  │ ❌ Wrong URL │ BROKEN    │
│ Alert Stats         │ ✅       │ ❌ None  │ ❌ Not wired │ NOT DONE  │
│ Alert Assign        │ ✅       │ ⚠️ Wrong │ ❌ Wrong URL │ BROKEN    │
│ WebSocket           │ ✅       │ ✅ Client│ ❌ No subscribe│ BROKEN   │
│ WS URL Path         │ ✅       │ ⚠️ Wrong │ ❌ Missing prefix│ BROKEN│
│ Capture Control     │ ✅       │ ❌ None  │ ❌ Not wired │ NOT DONE  │
│ Intel/IOCs          │ ❌       │ ⚠️ Static│ ❌ No backend│ NOT DONE  │
│ ML Operations       │ ❌       │ ❌ None  │ ❌ Nothing   │ NOT DONE  │
│ LLM Chat            │ ❌       │ ❌ None  │ ❌ Nothing   │ NOT DONE  │
│ PCAP Upload         │ ❌       │ ❌ None  │ ❌ Nothing   │ NOT DONE  │
│ Reports             │ ❌       │ ❌ None  │ ❌ Nothing   │ NOT DONE  │
│ Admin/Users         │ ❌       │ ⚠️ Static│ ❌ Nothing   │ NOT DONE  │
└─────────────────────┴──────────┴──────────┴──────────────┴───────────┘

Legend: ✅ = Done  ⚠️ = Partial  ❌ = Missing/Broken
```

### Summary Counts

| Severity | Count | Impact |
|----------|-------|--------|
| 🔴 CRITICAL | 6 | Data flow between frontend and backend is fundamentally broken |
| 🟠 HIGH | 8 | Features that exist will malfunction or have security gaps |
| 🟡 MEDIUM | 8 | Performance issues, tech debt, and maintainability concerns |
| 🔵 LOW | 7 | Code quality, documentation gaps, and minor inconsistencies |
| **TOTAL** | **29** | |

### Priority Fix Order

1. **Fix WebSocket URL path** (MED-05) — quick win, enables real-time
2. **Fix WebSocket subscribe action** (CRIT-02) — enables real-time data
3. **Align `FlowResponse` type** (HIGH-04) — foundation for all flow features
4. **Align `AlertResponse`/`Alert` type** (CRIT-04) — foundation for alert features
5. **Fix alert service endpoint URLs** (CRIT-03) — enables alert lifecycle
6. **Fix `useFlows` response shape handling** (CRIT-01) — enables War Room
7. **Fix flow search GET→POST** (CRIT-05) — enables Threat Hunt
8. **Fix protocol int→string mapping** (CRIT-06) — correct display
9. **Add auth guard** (HIGH-01) — security
10. **Refactor `useFlows` to use service layer** (HIGH-08) — maintainability
