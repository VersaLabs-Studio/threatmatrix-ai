# ThreatMatrix AI — Frontend Tasks (Day 8-9)

> **Date:** 2026-03-22
> **Sprint:** 2 (Capture Engine + Core UI)
> **Owner:** Full-Stack Dev
> **Goal:** Connect War Room components to live VPS API data
> **Reference:** MASTER_DOC_PART3 §2 (War Room), MASTER_DOC_PART5 §3 (Week 2 Plan)

---

## Objective

The VPS is fully operational. The capture engine is live on `187.124.45.161`, capturing real network traffic, and persisting flows to PostgreSQL. The backend has 18 REST endpoints and 1 WebSocket endpoint all working.

**Your task:** Connect the existing War Room frontend components to the live VPS API so the dashboard displays real data instead of empty states.

All 9 War Room components already exist. The hooks (`useWebSocket`, `useFlows`, `useAlerts`) already exist. The API client (`lib/api.ts`) and WebSocket client (`lib/websocket.ts`) already exist. The task is **wiring**, not building.

---

## VPS Connection Setup

### Step 1: Update Environment Variables

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://187.124.45.161:8000
NEXT_PUBLIC_WS_URL=ws://187.124.45.161:8000
```

### Step 2: Understand DEV_MODE Auth Bypass

The VPS has `DEV_MODE=true` which means:
- **All API endpoints work without JWT authentication**
- The backend returns a mock admin user for every request
- **No login page needed** — skip auth entirely for now
- The WebSocket endpoint requires a token, but with DEV_MODE you can pass any string

### Step 3: WebSocket Connection with DEV_MODE

The WebSocket client (`lib/websocket.ts`) connects to:
```
ws://187.124.45.161:8000/ws/?token=<jwt>
```

With DEV_MODE enabled, the backend accepts any token. Update `useWebSocket.ts` or the connection logic to:
- Use a dummy token when no real JWT is available (e.g., `"dev-mode-token"`)
- Or skip WebSocket connection if token is null and fall back to polling only

**Current behavior:** The hook reads `localStorage.getItem('tm_access_token')`. If null, it doesn't connect. You need to handle the DEV_MODE case.

---

## Component-to-API Connection Matrix

Per MASTER_DOC_PART3 §2.3, each War Room component has a specific data source:

| Component | API Endpoint | Hook | Polling | Spec Reference |
|-----------|-------------|------|---------|----------------|
| **MetricCard (Pkts/s)** | `/api/v1/flows/stats` | `useFlows` | 3s | PART3 §2.3 |
| **MetricCard (Flows)** | `/api/v1/flows/stats` | `useFlows` | 3s | PART3 §2.3 |
| **MetricCard (Anomaly%)** | `/api/v1/flows/stats` | `useFlows` | 3s | PART3 §2.3 |
| **MetricCard (Threats)** | `/api/v1/alerts/stats` | `useAlerts` | 3s | PART3 §2.3 |
| **ProtocolChart** | `/api/v1/flows/protocols` | `useFlows` | 10s | PART3 §2.3 |
| **TrafficTimeline** | `/api/v1/flows/stats?interval=1m` | `useFlows` | 5s | PART3 §2.3 |
| **TopTalkers** | `/api/v1/flows/top-talkers` | `useFlows` | 10s | PART3 §2.3 |
| **LiveAlertFeed** | WebSocket `alerts:live` | `useWebSocket` | Real-time | PART3 §2.3 |
| **ThreatMap** | WebSocket `flows:live` | `useWebSocket` | Real-time | PART3 §2.3 |
| **ThreatLevel** | `/api/v1/alerts/stats` | `useAlerts` | 5s | PART3 §2.3 |
| **AIBriefingWidget** | Placeholder (LLM Week 4) | — | — | PART3 §2.3 |
| **GeoDistribution** | `/api/v1/flows/` (aggregated) | `useFlows` | 30s | PART3 §2.3 |

---

## Task Breakdown

### TASK 1 — DEV_MODE WebSocket Connection 🔴

**Priority:** Critical | **Time Est:** 30 min

**Problem:** `useWebSocket` reads `localStorage.getItem('tm_access_token')`. If null, it doesn't connect to WebSocket. On VPS with DEV_MODE, we need a fallback.

**Solution:** Update `frontend/hooks/useWebSocket.ts` to handle DEV_MODE:

```typescript
// In the useEffect where it connects:
const token = typeof window !== 'undefined' ? localStorage.getItem('tm_access_token') : null;
// DEV_MODE fallback: use a dummy token (backend accepts any token when DEV_MODE=true)
const effectiveToken = token ?? 'dev-mode-bypass';
if (effectiveToken) wsClient.connect(effectiveToken);
```

**Verification:**
| Check | Expected |
|-------|----------|
| Browser console shows `[ThreatMatrix WS] Connected` | Connected |
| `useWebSocket().isConnected` = `true` | true |

---

### TASK 2 — Verify API Client Returns Real Data 🔴

**Priority:** Critical | **Time Est:** 15 min

**Test each endpoint from the browser:**

```bash
# Open browser DevTools → Network tab → navigate to /war-room
# Check that these requests succeed:

GET http://187.124.45.161:8000/api/v1/flows/stats?interval=1m → 200 OK
GET http://187.124.45.161:8000/api/v1/flows/protocols → 200 OK
GET http://187.124.45.161:8000/api/v1/flows/top-talkers → 200 OK
GET http://187.124.45.161:8000/api/v1/alerts?limit=100 → 200 OK
GET http://187.124.45.161:8000/api/v1/alerts/stats → 200 OK
```

**If CORS errors appear:** The VPS backend CORS config includes `http://localhost:3000` but NOT the VPS IP. You may need to add the VPS IP to CORS origins, or run the frontend on localhost:3000 (recommended for dev).

**Recommended approach:** Run `npm run dev` on your local machine (localhost:3000). The `.env.local` points API calls to the VPS. CORS is already configured for localhost:3000.

**Verification:**
| Check | Expected |
|-------|----------|
| No CORS errors in console | Clean |
| `useFlows()` returns non-empty `stats` array | Real data |
| `useFlows()` returns non-empty `protocols` array | Real data |
| `useFlows()` returns non-empty `topTalkers` array | Real data |
| `useAlerts()` returns alerts from VPS | Real data |

---

### TASK 3 — Wire MetricCard to Live Data 🔴

**Priority:** Critical | **Time Est:** 15 min

**Current state:** `frontend/app/war-room/page.tsx` already connects MetricCard to `useFlows` and `useAlerts`.

**Verify the data mapping:**

```typescript
// Current mapping in war-room/page.tsx:
const latestStat = stats[stats.length - 1];
const pps   = systemStatus?.packets_per_second ?? latestStat?.packets_per_second ?? 0;
const flows = systemStatus?.active_flows       ?? latestStat?.active_flows       ?? 0;
```

**Check if `FlowStats` interface matches the API response:**

API returns from `/api/v1/flows/stats?interval=1m`:
```json
[
  {
    "timestamp": "2026-03-22T20:00:00Z",
    "packets_per_second": 12847,
    "bytes_per_second": 9500000,
    "active_flows": 342,
    "anomaly_count": 3
  }
]
```

The `FlowStats` interface in `useFlows.ts` already matches this shape. No changes needed if data flows correctly.

**Verification:**
| Check | Expected |
|-------|----------|
| PACKETS/SEC card shows non-zero number | Real value |
| ACTIVE FLOWS card shows non-zero number | Real value |
| ANOMALY RATE shows computed percentage | Non-zero |
| THREATS (24H) shows alert count | Real count |

---

### TASK 4 — Wire ProtocolChart to Live Data 🔴

**Priority:** Critical | **Time Est:** 15 min

**Current state:** `ProtocolChart` receives `data={protocols}` from `useFlows`.

**Verify the data mapping:**

API returns from `/api/v1/flows/protocols`:
```json
[
  { "protocol": "tcp", "count": 1250, "percent": 62.5 },
  { "protocol": "udp", "count": 480, "percent": 24.0 },
  { "protocol": "icmp", "count": 160, "percent": 8.0 },
  { "protocol": "other", "count": 110, "percent": 5.5 }
]
```

The `ProtocolStats` interface in `useFlows.ts` matches this.

**Check the ProtocolChart component** (`components/war-room/ProtocolChart.tsx`) to verify it accepts `ProtocolStats[]` and renders correctly.

**Verification:**
| Check | Expected |
|-------|----------|
| Donut chart shows TCP/UDP/ICMP/Other segments | Non-empty |
| Percentages match real traffic distribution | Real values |
| Colors match design system (cyan, amber, green, blue) | Correct |

---

### TASK 5 — Wire TrafficTimeline to Live Data 🔴

**Priority:** Critical | **Time Est:** 15 min

**Current state:** `TrafficTimeline` receives `data={stats}` from `useFlows`.

**Verify the data mapping:**

API returns from `/api/v1/flows/stats?interval=1m`:
```json
[
  { "timestamp": "2026-03-22T19:55:00Z", "packets_per_second": 8500, "anomaly_count": 1 },
  { "timestamp": "2026-03-22T19:56:00Z", "packets_per_second": 9200, "anomaly_count": 0 },
  ...
]
```

**Check the TrafficTimeline component** (`components/war-room/TrafficTimeline.tsx`) to verify it renders an area chart with the stats array.

**Verification:**
| Check | Expected |
|-------|----------|
| Area chart shows data points over time | Non-empty |
| Cyan glowing area for normal traffic | Visible |
| Red overlay for anomaly spikes | Visible when anomalies exist |

---

### TASK 6 — Wire TopTalkers to Live Data 🟡

**Priority:** Medium | **Time Est:** 10 min

**Current state:** `TopTalkers` receives `data={topTalkers}` from `useFlows`.

API returns from `/api/v1/flows/top-talkers`:
```json
[
  { "ip": "187.124.45.161", "bytes_total": 5200000, "flow_count": 342, "is_anomalous": false },
  { "ip": "153.92.2.6", "bytes_total": 1800000, "flow_count": 128, "is_anomalous": false }
]
```

**Verification:**
| Check | Expected |
|-------|----------|
| Top IPs listed with byte counts | Real values |
| Bar chart shows relative volume | Proportional |

---

### TASK 7 — Wire LiveAlertFeed to WebSocket 🔴

**Priority:** Critical | **Time Est:** 30 min

**Current state:** `LiveAlertFeed` receives `lastAlertEvent` from `useWebSocket`.

**Problem:** With no ML models trained yet (Week 3), there are no alerts being auto-generated. The LiveAlertFeed will be empty until Week 4 when the alert engine is implemented.

**Interim solution:** Either:
- Show a "No alerts yet — ML models not trained" placeholder
- Or seed the VPS with mock alerts using `seed_mock_data.py` on the VPS

**Run on VPS to seed alerts:**
```bash
docker compose exec backend python seed_mock_data.py
```

**Verification:**
| Check | Expected |
|-------|----------|
| LiveAlertFeed shows seeded alerts | 25 alerts visible |
| New WebSocket alert events appear in real-time | If any generated |

---

### TASK 8 — Wire ThreatMap to WebSocket 🔴

**Priority:** Critical | **Time Est:** 45 min

**Current state:** `ThreatMap` is a Deck.gl component that should render dots on a world map based on flow geo-IP data.

**Problem:** The WebSocket `flows:live` channel publishes flow data, but it doesn't include geo-IP coordinates (lat/lon). The `FlowEvent` interface expects `src_lat`, `src_lon`, `dst_lat`, `dst_lon`.

**Options:**
1. **Add geo-IP resolution** in the backend (Week 2-3 task) — use a free GeoIP database (MaxMind GeoLite2)
2. **Use mock coordinates** for now — assign random coordinates to IPs for visual demo
3. **Skip ThreatMap for now** — focus on other components, implement ThreatMap when geo-IP is ready

**Recommended:** Option 2 for Week 2 demo, then Option 1 for production.

**If implementing mock geo-IP on frontend:**
```typescript
// In the WebSocket flow event handler, assign mock coordinates:
const mockGeoIp = (ip: string) => {
  // Simple hash-based pseudo-random coordinates
  const hash = ip.split('.').reduce((a, b) => a + parseInt(b), 0);
  return {
    src_lat: 10 + (hash % 60) - 30,  // -20 to 40
    src_lon: 20 + (hash % 260) - 130, // -110 to 150
  };
};
```

**Verification:**
| Check | Expected |
|-------|----------|
| Map renders with dark basemap | Visible |
| Flow dots appear on map | Cyan dots for normal |
| Arc connections between IPs | Glowing arcs |

---

### TASK 9 — Wire ThreatLevel Gauge 🟡

**Priority:** Medium | **Time Est:** 15 min

**Current state:** `ThreatLevel` receives `level` prop computed from alert severity counts.

```typescript
// Current logic in war-room/page.tsx:
const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
const highCount = alerts.filter((a) => a.severity === 'high').length;
const threatLevel = criticalCount > 0 ? 'CRITICAL' : highCount > 0 ? 'HIGH' : 'ELEVATED';
```

This should work correctly once alerts are seeded. No code changes needed.

**Verification:**
| Check | Expected |
|-------|----------|
| Gauge shows correct level based on alerts | ELEVATED/HIGH/CRITICAL |
| Color matches level | Green/Amber/Red |

---

### TASK 10 — War Room Layout Polish 🟡

**Priority:** Medium | **Time Est:** 30 min

**Per MASTER_DOC_PART3 §2.2, the War Room layout must be:**

```
Row 1: 4× MetricCard grid
Row 2: ThreatMap (left, 1fr) + ProtocolChart/TrafficTimeline/ThreatLevel (right, 280px)
Row 3: AI Briefing (full width)
Row 4: LiveAlertFeed | TopTalkers | GeoDistribution (3-column grid)
```

**Check current `war-room/page.tsx` layout against the spec.** The current layout already matches this structure. Verify:
- Grid gaps are consistent (`var(--space-4)` for major sections, `var(--space-3)` for metric cards)
- GlassPanel styling is applied to all containers
- Scan-line animation overlay is present
- Colors match design system

**Design System Reference (per PART3 §1.2):**
```css
--bg-primary: #0a0a0f;     /* Deep black */
--bg-secondary: #111118;    /* Panel backgrounds */
--cyan: #00f0ff;            /* Primary accent */
--critical: #ef4444;        /* Critical alerts */
--warning: #f59e0b;         /* Warning */
--safe: #22c55e;            /* Safe/resolved */
--info: #3b82f6;            /* Informational */
--font-data: "JetBrains Mono", monospace;
--font-ui: "Inter", -apple-system, sans-serif;
```

**Verification:**
| Check | Expected |
|-------|----------|
| 4 metric cards in Row 1 | Correct grid |
| ThreatMap dominates Row 2 left | 1fr width |
| 3 panels stacked on Row 2 right | 280px width |
| AI Briefing spans Row 3 | Full width |
| 3-column grid in Row 4 | Equal columns |
| All panels use GlassPanel | Glassmorphism |
| Scan-line animation visible | Subtle cyan line |

---

## Acceptance Criteria

Day 8-9 is complete when:

1. ✅ Frontend connects to VPS at `187.124.45.161:8000`
2. ✅ WebSocket connects with DEV_MODE token fallback
3. ✅ MetricCard shows real packets/sec from VPS
4. ✅ ProtocolChart shows real protocol distribution
5. ✅ TrafficTimeline shows real traffic over time
6. ✅ TopTalkers shows real IP rankings
7. ✅ LiveAlertFeed shows seeded alerts (if seeded on VPS)
8. ✅ ThreatMap renders (even with mock geo-IP)
9. ✅ ThreatLevel gauge reflects real alert severity
10. ✅ War Room layout matches MASTER_DOC_PART3 §2.2 spec
11. ✅ No console errors (CORS, auth, or data format)
12. ✅ All components use design system colors and fonts

---

## Reference Documents

| Document | Section | Purpose |
|----------|---------|---------|
| MASTER_DOC_PART3 | §1.2-1.3 | Design system colors and typography |
| MASTER_DOC_PART3 | §1.4-1.5 | GlassPanel, scan-line, layout system |
| MASTER_DOC_PART3 | §2.2-2.3 | War Room layout grid and component specs |
| MASTER_DOC_PART3 | §2.4 | Deck.gl map layers |
| MASTER_DOC_PART5 | §3 (Week 2) | Week 2 task assignments for Full-Stack Dev |
| SESSION_HANDOFF.md | §API Coverage | Complete endpoint list |

---

_Task document for Full-Stack Dev — Day 8-9 (Week 2)_
_Focus: War Room component connection to live VPS data_
_Strict adherence to MASTER_DOC_PART3 design system and component specifications_
