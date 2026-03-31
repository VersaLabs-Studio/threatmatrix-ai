# ThreatMatrix AI — Frontend Visual & Code Audit Report

> **Audit Date:** March 30, 2026 (Day 18 — Lead Architect Review)  
> **Produced By:** Lead Architect's Coding Agent  
> **Frontend Owner:** Full-Stack Dev  
> **Frontend Version:** v0.5.0 (per code headers)  
> **Framework:** Next.js 16.1.6 (App Router) + React 19.2.3 + Vanilla CSS  
> **Overall Grade:** **B+** — Solid foundation, needs data integration + polish

---

## 1. Executive Summary

The frontend is a **visually impressive dark-themed SIEM dashboard** with a well-implemented design system (Obsidian Refraction v3.0). The full-stack dev has built 10 pages, 20+ components, 8 custom hooks, and integrated WebSocket real-time feeds. However, several pages still rely on **mock/static data** instead of live backend APIs, and a few pages are **missing AuthGuard wrapping**. The login page is exceptionally polished (1,177 lines with canvas star field + shooting stars).

### Score Card

| Category | Score | Notes |
|----------|:-----:|-------|
| **Design System** | ⭐⭐⭐⭐⭐ | Exceptional — glassmorphism, custom tokens, responsive |
| **Live API Integration** | ⭐⭐⭐⭐ | War Room, Alerts, AI Analyst, Intel, ML Ops connected |
| **Mock Data Remaining** | ⭐⭐ | Forensics, Reports, Admin, Hunt still use mocks |
| **TypeScript Quality** | ⭐⭐⭐⭐ | Types mostly correct, some `any` usage |
| **Auth/Security** | ⭐⭐⭐ | AuthGuard exists but inconsistently applied |
| **Performance** | ⭐⭐⭐⭐ | Dynamic imports for Deck.gl, SSR-safe patterns |
| **Responsive Design** | ⭐⭐⭐ | Grid breakpoints exist, mobile sidebar hides |
| **Accessibility** | ⭐⭐ | Login has focus-visible, other pages lacking |

---

## 2. Page-by-Page Audit

### 2.1 Login Page (`/login`) — ⭐⭐⭐⭐⭐ EXCELLENT

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Canvas star field, shooting stars, radar pings, glassmorphic card |
| API integration | ✅ | `POST /api/v1/auth/login` → token storage |
| Auth flow | ✅ | Redirects to `/war-room` on success |
| Accessibility | ✅ | `focus-visible` outlines, `prefers-reduced-motion` support |
| Responsive | ✅ | Responsive card width at 500px breakpoint |
| Error handling | ✅ | 401, 429, Network errors handled with user messages |
| **Issue** | ⚠️ | **1,177 lines** — should be split into smaller components |

### 2.2 War Room (`/war-room`) — ⭐⭐⭐⭐ GREAT

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | MetricCards, Deck.gl ThreatMap, ProtocolChart, TrafficTimeline |
| Live data | ✅ | WebSocket (ml:live, alerts:live), useFlows, useAlerts, useMLModels |
| Real-time anomaly | ✅ | lastAnomalyEvent → LiveAlertFeed |
| AI Briefing | ✅ | Connected to POST /llm/chat |
| AuthGuard | ✅ | `<AuthGuard>` wraps the page |
| **Issue** | ⚠️ | TrafficTimeline receives `data={[]}` — timeline data not connected |
| **Issue** | ⚠️ | GeoDistribution is static/mock (no live geo data) |
| **Issue** | ⚠️ | TopTalkers may show mock data when backend returns empty |

### 2.3 Alert Console (`/alerts`) — ⭐⭐⭐⭐ GREAT

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | DataTable, StatusBadge, filter toolbar |
| Live data | ✅ | useAlerts hook with severity/status filters |
| Alert drawer | ✅ | AlertDetailDrawer with AI narrative + "Analyze with AI" button |
| Status update | ✅ | updateStatus integrated |
| AuthGuard | ✅ | Applied |
| **Issue** | ⚠️ | Category filter (`categoryFilter`) is defined but never passed to `useAlerts` |
| **Issue** | ⚠️ | `FilterGroup` uses `any` type for props |

### 2.4 AI Analyst (`/ai-analyst`) — ⭐⭐⭐⭐ GREAT

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Chat interface with streaming cursor |
| Live data | ✅ | useLLM hook with SSE streaming |
| Alert context | ✅ | Auto-fetches alert when `?alert_id=` present |
| Budget widget | ✅ | Shows request count + token usage |
| Quick actions | ✅ | 4 preset prompt buttons |
| AuthGuard | ✅ | Applied |
| **Issue** | ⚠️ | Messages don't render markdown — raw text only |

### 2.5 ML Operations (`/ml-ops`) — ⭐⭐⭐⭐ GREAT

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Model cards, ensemble config, tuning results |
| Live data | ✅ | useMLModels + mlService.getComparison() |
| Retrain button | ✅ | POST /ml/retrain + status polling every 3s |
| Ensemble display | ✅ | Correctly shows 0.30/0.45/0.25 weights |
| AuthGuard | ✅ | Applied |
| **Issue** | ⚠️ | No confusion matrix visualization (backend has the data) |
| **Issue** | ⚠️ | No training history timeline (backend has the endpoint) |
| **Issue** | ⚠️ | Tuning results are hardcoded (should pull from backend `best_params.json`) |
| **Issue** | 🟡 | `@keyframes spin` referenced but not defined in globals.css |

### 2.6 Intel Hub (`/intel`) — ⭐⭐⭐⭐ GREAT

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Feed cards, IOC browser, lookup widget |
| Live data | ✅ | useIntel hook with fallback to mock |
| IP Lookup | ✅ | GET /intel/lookup/{query} with results display |
| Feed Sync | ✅ | POST /intel/sync with spinner |
| AuthGuard | ❌ | **NOT applied** — page is unguarded |
| **Issue** | ⚠️ | Feed activity chart uses static bar heights, not real data |

### 2.7 Network Flow (`/network`) — ⭐⭐⭐½ GOOD

| Aspect | Status | Details |
|--------|:------:|---------|
| Live data | ✅ | useFlows hook connected |
| Anomaly highlighting | ✅ | `.flow-row-anomaly` CSS class applied |
| ML score gradient | ✅ | Color-coded: red ≥0.75, yellow ≥0.50, amber ≥0.30, green <0.30 |
| AuthGuard | ❓ | Need to verify |
| **Issue** | ⚠️ | No connection graph visualization (Week 6 deliverable) |

### 2.8 Forensics Lab (`/forensics`) — ⭐⭐ NEEDS WORK

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Upload area with drag/drop UI, history list |
| Live data | ❌ | **ALL MOCK DATA** — `MOCK_UPLOADS` hardcoded |
| Upload functionality | ❌ | Upload area has no `onClick` handler or file input |
| POST /capture/upload-pcap | ❌ | Not connected (backend endpoint exists since Day 14) |
| AuthGuard | ❌ | **NOT applied** |
| **Priority** | 🔴 | Should connect to `POST /capture/upload-pcap` — backend is ready |

### 2.9 Reports (`/reports`) — ⭐⭐ NEEDS WORK

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Report type cards, history list with download buttons |
| Live data | ❌ | **ALL MOCK DATA** — `MOCK_REPORTS` hardcoded |
| Generate button | ❌ | No click handler — decorative only |
| Download button | ❌ | No click handler — decorative only |
| POST /reports/generate | ❌ | Not connected (backend created Day 15, PDF Day 17) |
| GET /reports | ❌ | Not connected |
| GET /reports/{id}/download | ❌ | Not connected |
| AuthGuard | ❌ | **NOT applied** |
| **Priority** | 🔴 | Backend has PDF generation ready — just needs API wiring |

### 2.10 Administration (`/admin`) — ⭐⭐ NEEDS WORK

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Admin card grid, icon + description layout |
| Live data | ❌ | **ALL MOCK/STATIC** — status values hardcoded ("4 users", "$42 spent", "128 entries") |
| Card navigation | ❌ | Cards have `cursor: pointer` but no `onClick` |
| Sub-pages | ❌ | No `/admin/users`, `/admin/audit`, `/admin/llm-budget` sub-pages exist |
| GET /admin/audit-log | ❌ | Not connected (backend created Day 16, wired Day 17) |
| GET /llm/budget | ⚠️ | Data available but not shown here (shown in AI Analyst page only) |
| AuthGuard | ❌ | **NOT applied** |
| **Priority** | 🟡 | Week 6 deliverable, but audit log data is available |

### 2.11 Threat Hunt (`/hunt`) — ⭐⭐½ NEEDS WORK

| Aspect | Status | Details |
|--------|:------:|---------|
| Visual quality | ✅ | Search bar, protocol filters, results table |
| Live data | ❌ | **ALL MOCK DATA** — `MOCK_FLOWS` hardcoded |
| Search | ⚠️ | Client-side filter on mock data only |
| Flow search API | ❌ | Not connected to useFlows with search params |
| AuthGuard | ❌ | **NOT applied** |
| **Priority** | 🟡 | Should connect to `GET /flows` with search query |

---

## 3. Architecture Quality Assessment

### 3.1 Component Structure ✅ Good

```
components/
├── auth/AuthGuardWrapper.tsx       ✅ Client-side route protection
├── alerts/AlertDetailDrawer.tsx    ✅ Detailed, with AI narrative
├── layout/
│   ├── AppShell.tsx                ✅ Proper server/client split
│   ├── Sidebar.tsx                 ✅ Icon nav with active states
│   ├── TopBar.tsx                  ✅ Status indicators
│   └── StatusBar.tsx               ✅ Connection status
├── shared/
│   ├── GlassPanel.tsx              ✅ Reusable glass container
│   ├── DataTable.tsx               ✅ Generic table with row callbacks
│   ├── StatusBadge.tsx             ✅ Severity badges
│   ├── NotificationToast.tsx       ✅ Toast system
│   ├── LoadingState.tsx            ✅ Skeleton loader
│   ├── EmptyState.tsx              ✅ Empty data display
│   └── ErrorBanner.tsx             ✅ Error display
└── war-room/ (9 widgets)           ✅ Well-decomposed
```

### 3.2 Hooks Architecture ✅ Good

| Hook | API Connected | Status |
|------|:------------:|:------:|
| `useWebSocket.ts` | ✅ 4 channels | WebSocket reconnect + heartbeat |
| `useFlows.ts` | ✅ 4 endpoints | Flows, stats, protocols, topTalkers |
| `useAlerts.ts` | ✅ 3 endpoints | List, stats, updateStatus |
| `useLLM.ts` | ✅ 1 endpoint | Chat with SSE streaming |
| `useMLModels.ts` | ✅ 1 endpoint | Model list |
| `useIntel.ts` | ✅ 1 endpoint | IOC list |
| `useCapture.ts` | ✅ 2 endpoints | Status, interfaces |
| `useSystemHealth.ts` | ✅ 1 endpoint | System health |

### 3.3 Design System Compliance ✅ Excellent

| Rule | Status | Evidence |
|------|:------:|---------|
| No Tailwind CSS | ✅ | Vanilla CSS + CSS Variables throughout |
| JetBrains Mono for data | ✅ | `var(--font-data)` used for all metrics, scores, IPs |
| Inter for UI text | ✅ | `var(--font-ui)` used for labels, descriptions |
| Outfit for headings | ✅ | `var(--font-heading)` used for page titles |
| CSS Variables for colors | ✅ | All severity colors use `var(--critical)`, etc. |
| GlassPanel components | ✅ | Used on every page for card containers |
| Dark theme | ✅ | Deep Space palette with glassmorphism |

### 3.4 Known Build Issue

The Next.js 16 **production build fails** (`pnpm build`), but `pnpm dev` works correctly. This is likely related to server/client boundary issues or dynamic imports.

---

## 4. Issues Ranked by Priority

### 🔴 Critical (Must Fix for Demo)

| # | Issue | Page | Fix Effort |
|---|-------|------|:----------:|
| C1 | Forensics page 100% mock — needs `POST /capture/upload-pcap` wiring | `/forensics` | 30 min |
| C2 | Reports page 100% mock — needs generate/list/download API wiring | `/reports` | 45 min |
| C3 | AuthGuard missing on 5 pages (intel, forensics, reports, admin, hunt) | Multiple | 15 min |

### 🟡 High (Should Fix This Week)

| # | Issue | Page | Fix Effort |
|---|-------|------|:----------:|
| H1 | Admin page 100% static — audit log, LLM budget data available | `/admin` | 60 min |
| H2 | Hunt page uses mock data — should connect to useFlows search | `/hunt` | 30 min |
| H3 | ML Ops missing confusion matrix + training history visualizations | `/ml-ops` | 90 min |
| H4 | TrafficTimeline receives empty data on War Room | `/war-room` | 20 min |
| H5 | Admin sub-pages don't exist (/audit, /users, /llm-budget) | `/admin/*` | 120 min |

### 🟢 Low (Polish Items)

| # | Issue | Page | Fix Effort |
|---|-------|------|:----------:|
| L1 | Login page is 1,177 lines — split into components | `/login` | 30 min |
| L2 | Category filter not wired in Alert Console | `/alerts` | 10 min |
| L3 | AI Analyst doesn't render markdown in responses | `/ai-analyst` | 20 min |
| L4 | GeoDistribution is fully static | `/war-room` | 45 min |
| L5 | Feed activity chart uses static heights | `/intel` | 15 min |
| L6 | `APP_VERSION` is `'v0.1.0'` — should be `'v0.5.0'` | constants.ts | 1 min |
| L7 | `any` type used in several places | Multiple | 20 min |
| L8 | `@keyframes spin` used but not defined | globals.css | 2 min |
| L9 | Admin card statuses are hardcoded strings | `/admin` | 15 min |

---

## 5. Visual Audit Recommendations

### 5.1 What Looks Great ✅

1. **Login page** — Industry-grade with canvas animations, perfect for demo
2. **War Room** — 5 metric cards + Deck.gl map + 3-column bottom row is impressive
3. **Glass panels** — Conic gradient borders with mouse tracking is premium
4. **Severity badges** — Consistent with scanning animation across all pages
5. **Dark theme** — Deep Space palette with subtle cyan/purple accents
6. **Typography** — Mono for data, Inter for UI, Outfit for headings is correct
7. **Notification toasts** — WebSocket-driven with severity color coding

### 5.2 What Needs Visual Polish 🟡

1. **Reports page** — Generate button needs click animation + loading state
2. **Admin page** — Cards need hover lift effect matching GlassPanel
3. **Hunt page** — Search input needs focus ring matching design system
4. **Forensics upload** — Drop area needs drag-hover state + file type validation visual
5. **ML Ops retrain** — Missing `@keyframes spin` causes broken animation

---

## 6. Testing Checklist for Local Demo

To test the frontend locally against the VPS backend:

### 6.1 Prerequisites

```bash
# 1. Set environment variables for VPS backend
# Create/edit frontend/.env.local:
NEXT_PUBLIC_API_URL=http://187.124.45.161:8000
NEXT_PUBLIC_WS_URL=ws://187.124.45.161:8000

# 2. Start dev server
cd frontend
pnpm dev --port 3000

# 3. Open browser to http://localhost:3000
```

### 6.2 Page-by-Page Test Script

| # | Page | Test | Expected Result | Depends On |
|---|------|------|-----------------|:----------:|
| 1 | `/login` | Enter any email/password, click Sign In | Auth error OR redirect to war-room (DEV_MODE) | VPS backend |
| 2 | `/login` | Set `tm_access_token` in localStorage manually | Skip login, access all pages | — |
| 3 | `/war-room` | Check metric cards | Packets/sec + Active flows should update | WebSocket |
| 4 | `/war-room` | Watch for anomaly toasts | Toast popups when ML detects anomaly | WebSocket ml:live |
| 5 | `/war-room` | Check Threat Map | Deck.gl renders with base map | MapLibre |
| 6 | `/war-room` | Check AI Briefing widget | Should display LLM-generated briefing | LLM API |
| 7 | `/alerts` | Check alert table | Shows live alerts with severity badges | Alert API |
| 8 | `/alerts` | Click an alert row | AlertDetailDrawer opens with AI narrative | Alert detail API |
| 9 | `/alerts` | Click "Analyze with AI" in drawer | Navigates to `/ai-analyst?alert_id=...` | Navigation |
| 10 | `/ai-analyst` | Type message, press Enter | LLM responds with streaming text | LLM chat API |
| 11 | `/ai-analyst` | Check budget widget (top right) | Shows request count + tokens | LLM budget API |
| 12 | `/ml-ops` | Check model cards | 3 models with accuracy, F1, AUC-ROC | ML models API |
| 13 | `/ml-ops` | Click "RETRAIN MODELS" | Button shows spinning, status updates | ML retrain API |
| 14 | `/ml-ops` | Check ensemble config block | Shows 0.30/0.45/0.25 weights | Static |
| 15 | `/intel` | Check feed cards (OTX, AbuseIPDB, VT) | Shows ONLINE/OFFLINE status | Feed status API |
| 16 | `/intel` | Enter `8.8.8.8` in lookup, click LOOKUP | Shows OTX + AbuseIPDB results | Intel lookup API |
| 17 | `/intel` | Click SYNC FEEDS | Spinner shows, IOC count updates | Intel sync API |
| 18 | `/network` | Check flow table | Shows flows with ML Score column | Flows API |
| 19 | `/network` | Look for anomalous rows | Red left border on `is_anomaly=true` rows | Flows API |
| 20 | `/forensics` | Visit page | Upload area + mock history visible | — |
| 21 | `/reports` | Visit page | Report type cards + mock history visible | — |
| 22 | `/admin` | Visit page | 6 admin cards visible (static data) | — |
| 23 | `/hunt` | Visit page | Search bar + mock flows visible | — |

### 6.3 DEV_MODE Bypass (No Login Required)

If `DEV_MODE=true` on VPS, you can bypass login by setting a token in browser console:

```javascript
localStorage.setItem('tm_access_token', 'dev-mode-bypass');
window.location.reload();
```

This will pass the AuthGuard check and allow access to all pages. The backend accepts any token in DEV_MODE.

---

## 7. Recommendations for Day 18

### Immediate (Today)

1. **Wire Forensics to live API** — Connect upload area to `POST /capture/upload-pcap`, show real upload history
2. **Wire Reports to live API** — Connect generate/list/download to backend (PDF ready)
3. **Add missing AuthGuard** — Intel, Forensics, Reports, Admin, Hunt pages
4. **Fix missing `@keyframes spin`** — Add to globals.css
5. **Update APP_VERSION** — Change from 'v0.1.0' to 'v0.5.0'

### This Week

6. **Wire Admin page** — Show real audit log count, LLM budget, user count from APIs
7. **Wire Hunt page** — Connect to `GET /flows` with search query
8. **Add confusion matrix chart** — Use recharts + data from `GET /ml/models/{type}/confusion-matrix`
9. **Add training history** — Use data from `GET /ml/training-history`
10. **Create admin sub-pages** — `/admin/audit`, `/admin/users`, `/admin/llm-budget`

---

_ThreatMatrix AI — Frontend Audit Report_  
_Auditor: Lead Architect's Coding Agent_  
_Generated: March 30, 2026 (Day 18)_
