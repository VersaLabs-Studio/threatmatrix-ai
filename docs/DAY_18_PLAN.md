# ThreatMatrix AI — Day 18 Plan: Frontend Overhaul & VPS Integration

> **Date:** March 31, 2026 (Day 18)
> **Phase:** Week 6 — Feature Depth Completion + UI Polish
> **Owner:** Lead Architect (acting as code reviewer + integrator)
> **v0.5.0 Status:** 100% backend API (46/46 endpoints), Frontend partially wired

---

## 1. Executive Summary

The backend is **fully operational** on VPS with 46/46 API endpoints verified. The frontend has **10 pages** but only 5 are connected to live APIs (War Room, Alerts, AI Analyst, ML Ops, Intel). The remaining 5 (Forensics, Reports, Hunt, Admin, Network timeline) use mock/static data. Additionally, 6 pages lack AuthGuard protection, and CSS polish is incomplete on several pages.

**Goal:** Transform the frontend from "partially wired demo" to "fully integrated production UI" by:
1. Connecting to VPS backend from local dev environment
2. Wiring all 5 mock pages to live APIs
3. Adding AuthGuard to all unprotected pages
4. Polishing CSS consistency across all pages
5. Fixing all known bugs from the audit report

---

## 2. Current State Assessment

### 2.1 Pages Using Live Data (5/10)
| Page | Status | Data Source |
|------|--------|-------------|
| `/war-room` | ✅ Live | useWebSocket, useFlows, useAlerts, useMLModels, POST /llm/chat |
| `/alerts` | ✅ Live | useAlerts hook with severity/status filters |
| `/ai-analyst` | ✅ Live | useLLM hook, GET /alerts/{id}, GET /llm/budget |
| `/ml-ops` | ✅ Live | useMLModels, mlService.getComparison(), POST /ml/retrain |
| `/intel` | ⚠️ Hybrid | useIntel + fallback MOCK_IOCS, live feed status + lookup |

### 2.2 Pages Using Mock Data (5/10)
| Page | AuthGuard | Data Source | Backend Endpoint Available |
|------|-----------|-------------|---------------------------|
| `/forensics` | ❌ Missing | MOCK_UPLOADS (3 entries) | POST /capture/upload-pcap ✅ |
| `/reports` | ❌ Missing | MOCK_REPORTS (4 entries) | POST /reports/generate, GET /reports/, GET /reports/{id}/download ✅ |
| `/hunt` | ❌ Missing | MOCK_FLOWS (5 entries) | GET /flows, POST /flows/search ✅ |
| `/admin` | ❌ Missing | Hardcoded ADMIN_CARDS | GET /admin/audit-log, GET /llm/budget ✅ |
| `/network` | ❌ Missing | useFlows (live) + MOCK_FLOWS fallback | Timeline data empty (GET /flows/stats?interval=1m) ✅ |

### 2.3 CSS Issues Found
| Issue | Severity | Files Affected |
|-------|----------|---------------|
| `page-container` class used but not defined in globals.css | 🔴 | forensics, reports, hunt, admin |
| `@keyframes spin` missing (ML Ops retrain button broken) | 🔴 | ml-ops/page.tsx |
| Inline styles dominate all pages (no reusable CSS classes) | 🟡 | All pages |
| No focus-visible ring styles for inputs | 🟡 | hunt, intel, network |
| Inconsistent page header patterns | 🟡 | All pages |
| No hover-lift effect on Admin cards | 🟢 | admin/page.tsx |

### 2.4 Bug Inventory from Audit
| Bug | File | Status |
|-----|------|--------|
| APP_VERSION is 'v0.1.0' — should be 'v0.5.0' | constants.ts:79 | Open |
| AuthGuardWrapper is a no-op (`return <>{children}</>`) | AuthGuardWrapper.tsx | Open |
| ML Ops hyperparameter values hardcoded | ml-ops/page.tsx | Open |
| TrafficTimeline receives `data={[]}` | war-room/page.tsx, network/page.tsx | Open |
| GeoDistribution is fully static | war-room, network pages | Open |
| Forensics upload has no onClick handler | forensics/page.tsx | Open |
| Reports buttons are decorative (no handlers) | reports/page.tsx | Open |
| Hunt export/analyze buttons have no handlers | hunt/page.tsx | Open |
| Admin cards have cursor:pointer but no onClick | admin/page.tsx | Open |

---

## 3. Environment Setup Strategy

### 3.1 Local Frontend → VPS Backend Connection

The frontend runs locally (`pnpm dev` on port 3000) and connects to the VPS backend at `http://187.124.45.161:8000`. The backend has CORS configured for `localhost:3000` and `localhost:3001`.

**Step 1: Create `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://187.124.45.161:8000
NEXT_PUBLIC_WS_URL=ws://187.124.45.161:8000
```

**Step 2: DEV_MODE Bypass**
The VPS backend has `DEV_MODE=true`, so we can set a token in browser console:
```javascript
localStorage.setItem('tm_access_token', 'dev-mode-bypass');
window.location.reload();
```

**Step 3: Verify Connectivity**
```bash
# Test API reachability
curl http://187.124.45.161:8000/api/v1/system/health

# Start frontend
cd frontend
pnpm dev --port 3000
```

---

## 4. Task Breakdown (Ordered by Priority)

### Task 1: Fix AuthGuard + Missing CSS (🔴 Critical — 30 min)

**4.1.1 — Restore AuthGuardWrapper**
File: `frontend/components/auth/AuthGuardWrapper.tsx`

Current (no-op):
```typescript
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Fix: Restore the full implementation from INTEGRATION_WALKTHROUGH_FINAL.md (the original was created there but later replaced with a no-op). The implementation should:
- Check `localStorage.getItem('tm_access_token')`
- Redirect to `/login` if missing and not on login page
- Show nothing while checking
- Allow login page to render without auth

**4.1.2 — Add Missing `page-container` CSS Class**
File: `frontend/app/globals.css`

Add after `.main-content`:
```css
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

**4.1.3 — Add Missing `@keyframes spin`**
File: `frontend/app/globals.css`

Add with other keyframes:
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

**4.1.4 — Add Focus Ring Styles**
File: `frontend/app/globals.css`

```css
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
```

**Verification:**
- [ ] AuthGuard redirects unauthenticated users to /login
- [ ] Login page renders without auth
- [ ] Forensics, Reports, Hunt, Admin pages render without broken layout
- [ ] ML Ops retrain button shows spinner animation
- [ ] Input fields show cyan focus ring

---

### Task 2: Wire Forensics Page to Live API (🔴 Critical — 45 min)

**4.2.1 — Connect PCAP Upload**
File: `frontend/app/forensics/page.tsx`

Changes:
- Import `useCapture` hook and `api` from lib
- Add `<input type="file" ref={fileInputRef} accept=".pcap,.pcapng" hidden />`
- Wire drop zone `onClick` to trigger file input
- Wire `onChange` to call `api.upload('/api/v1/capture/upload-pcap', formData)`
- Show upload progress state
- On success, refetch upload list

**4.2.2 — Load Real Upload History**
- Fetch `GET /api/v1/capture/status` for current session stats
- Fetch `GET /api/v1/flows?source=pcap` for PCAP-processed flows
- Display real packet/flow/anomaly counts

**4.2.3 — Add Drag-and-Drop Feedback**
- Add `onDragOver` / `onDragLeave` state for visual feedback
- Change border color to cyan when dragging over

**Verification:**
- [ ] Click drop zone opens file picker
- [ ] Can upload a .pcap file to VPS
- [ ] Upload progress shown
- [ ] Upload history shows real data from VPS

---

### Task 3: Wire Reports Page to Live API (🔴 Critical — 45 min)

**4.3.1 — Connect Generate Button**
File: `frontend/app/reports/page.tsx`

Changes:
- Import `api` from lib
- Wire "Generate Report" button to `POST /api/v1/reports/generate`
- Show type selector (daily/incident/executive/ml_performance)
- Show loading state during generation
- On success, refetch report list

**4.3.2 — Load Real Reports**
- Fetch `GET /api/v1/reports/` on mount (and after generation)
- Display real report data (title, type, generated_at, file_size)

**4.3.3 — Connect Download Buttons**
- Wire "PDF" download buttons to `GET /api/v1/reports/{id}/download`
- Trigger browser download with correct filename

**Verification:**
- [ ] Generate Report button creates a PDF on VPS
- [ ] Report list shows real generated reports
- [ ] Download button downloads actual PDF file

---

### Task 4: Wire Hunt Page to Live API (🟡 High — 30 min)

**4.4.1 — Connect to Flow Search**
File: `frontend/app/hunt/page.tsx`

Changes:
- Import `useFlows` hook (already has `searchFlows` method)
- Replace `MOCK_FLOWS` with `useFlows` data
- Wire search input to `searchFlows()` with IP/label query
- Wire protocol filter to `searchFlows()` with protocol param
- Show loading state during search

**4.4.2 — Wire Export CSV Button**
- Collect filtered results into CSV format
- Trigger browser download of `.csv` file

**4.4.3 — Wire Analyze with AI Button**
- Navigate to `/ai-analyst` with selected flow context as query param

**Verification:**
- [ ] Search returns real flows from VPS
- [ ] Protocol filter narrows results
- [ ] Export CSV downloads a valid file
- [ ] Analyze with AI navigates to AI Analyst page

---

### Task 5: Wire Admin Page to Live Data (🟡 High — 45 min)

**5.5.1 — Load Real Stats**
File: `frontend/app/admin/page.tsx`

Changes:
- Fetch `GET /api/v1/admin/audit-log` for audit entry count
- Fetch `GET /api/v1/llm/budget` for real LLM spend
- Fetch `GET /api/v1/system/health` for system status
- Display real counts instead of hardcoded strings

**5.5.2 — Wire Card Navigation**
- Add `onClick` handlers using `useRouter().push(card.href)`
- Cards that have no sub-page yet: show "Coming Soon" toast

**Verification:**
- [ ] Audit Log card shows real entry count from VPS
- [ ] LLM Budget card shows real spend from VPS
- [ ] Cards navigate to sub-pages (or show coming soon)

---

### Task 6: Fix TrafficTimeline Empty Data (🟡 High — 20 min)

**6.6.1 — Connect Timeline to Flow Stats**
Files: `frontend/app/war-room/page.tsx`, `frontend/app/network/page.tsx`

The `useFlows` hook already fetches `flowService.getStats('1h')` which returns `FlowStatsResponse`. The `TrafficTimeline` component expects `FlowTimeline[]`. Need to:
- Check if `stats` from `useFlows` contains timeline data
- If yes, transform and pass to `TrafficTimeline`
- If the API returns aggregated stats (not timeline), use `flows` array to build a client-side timeline by grouping flows by timestamp into 1-minute buckets

**Verification:**
- [ ] War Room TrafficTimeline shows non-empty chart
- [ ] Network page TrafficTimeline shows non-empty chart

---

### Task 7: Fix ML Ops Hardcoded Data (🟡 High — 30 min)

**7.7.1 — Remove Hardcoded Hyperparameter Tuning**
File: `frontend/app/ml-ops/page.tsx`

Changes:
- Fetch `GET /api/v1/ml/training-history` for real training data
- Fetch `GET /api/v1/ml/models` for model-specific hyperparams
- Display real values instead of hardcoded "Current F1: 78.75% → Tuned F1: 83.03%"

**7.7.2 — Remove Hardcoded Training Config**
- Replace hardcoded "114.1s" / "125,973 train samples" with data from `ml_models` table

**Verification:**
- [ ] Hyperparameter section shows real data from VPS
- [ ] Training config shows real model metadata

---

### Task 8: CSS Polish Pass (🟢 Low — 60 min)

**8.8.1 — Page Header Standardization**
Create reusable CSS class in globals.css:
```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-top: 4px;
}
```

**8.8.2 — Admin Card Hover Effect**
Add hover lift to GlassPanel or add specific CSS:
```css
.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

**8.8.3 — Hunt Search Focus Ring**
Ensure search input uses focus-visible styles (from Task 1).

**8.8.4 — Forensics Drop Zone Hover State**
Add CSS for drag-hover state:
```css
.drop-zone--active {
  border-color: var(--cyan) !important;
  background: var(--cyan-muted) !important;
}
```

**Verification:**
- [ ] All pages use consistent header pattern
- [ ] Admin cards have hover lift effect
- [ ] Forensics drop zone shows cyan border on drag
- [ ] All inputs show focus ring

---

### Task 9: Constants & Version Cleanup (🟢 Low — 5 min)

**9.9.1 — Update APP_VERSION**
File: `frontend/lib/constants.ts`

```typescript
export const APP_VERSION = 'v0.5.0';  // was 'v0.1.0'
```

**Verification:**
- [ ] StatusBar shows "v0.5.0"

---

### Task 10: Final TypeScript Verification (🟢 Low — 10 min)

**10.10.1 — Run Type Check**
```bash
cd frontend
pnpm tsc --noEmit
```

**10.10.2 — Fix Any `any` Types**
- `FilterGroup` in alerts page uses `any` — add proper type
- `useAlerts.ts` filters uses `any` — add proper type

**Verification:**
- [ ] `pnpm tsc --noEmit` passes with 0 errors

---

## 5. Execution Order

| Step | Task | Duration | Cumulative |
|------|------|----------|------------|
| 1 | Environment setup (.env.local, dev-mode token) | 10 min | 10 min |
| 2 | Task 1: AuthGuard + Missing CSS | 30 min | 40 min |
| 3 | Task 2: Wire Forensics | 45 min | 85 min |
| 4 | Task 3: Wire Reports | 45 min | 130 min |
| 5 | Task 4: Wire Hunt | 30 min | 160 min |
| 6 | Task 5: Wire Admin | 45 min | 205 min |
| 7 | Task 6: Fix TrafficTimeline | 20 min | 225 min |
| 8 | Task 7: Fix ML Ops hardcoded | 30 min | 255 min |
| 9 | Task 8: CSS polish pass | 60 min | 315 min |
| 10 | Task 9: Version cleanup | 5 min | 320 min |
| 11 | Task 10: TypeScript verification | 10 min | 330 min |
| **Total** | | **~5.5 hours** | |

---

## 6. Testing Checklist (Per Audit Report §6.2)

| # | Page | Test | Expected Result |
|---|------|------|-----------------|
| 1 | `/login` | Enter credentials, click Sign In | Auth error or redirect to war-room |
| 2 | `/war-room` | Check metric cards | Packets/sec + Active flows update |
| 3 | `/war-room` | Watch for anomaly toasts | Toast popup on ML anomaly |
| 4 | `/war-room` | Check Threat Map | Deck.gl renders with map |
| 5 | `/war-room` | Check AI Briefing | LLM-generated briefing appears |
| 6 | `/war-room` | Check TrafficTimeline | Chart shows non-empty data |
| 7 | `/alerts` | Check alert table | Live alerts with severity badges |
| 8 | `/alerts` | Click alert row | AlertDetailDrawer opens |
| 9 | `/alerts` | Click "Analyze with AI" | Navigates to /ai-analyst?alert_id=... |
| 10 | `/ai-analyst` | Type message, Enter | LLM responds with streaming text |
| 11 | `/ai-analyst` | Check budget widget | Shows request count + tokens |
| 12 | `/ml-ops` | Check model cards | 3 models with real metrics |
| 13 | `/ml-ops` | Click "RETRAIN MODELS" | Spinner + status polling |
| 14 | `/ml-ops` | Check hyperparameter section | Real data from VPS |
| 15 | `/intel` | Check feed cards | Shows ONLINE/OFFLINE from API |
| 16 | `/intel` | Enter 8.8.8.8, LOOKUP | Shows reputation results |
| 17 | `/intel` | Click SYNC FEEDS | Spinner + IOC count updates |
| 18 | `/network` | Check flow table | Live flows with ML Score |
| 19 | `/network` | Check TrafficTimeline | Non-empty chart |
| 20 | `/forensics` | Click upload area | File picker opens |
| 21 | `/forensics` | Upload a .pcap file | Upload succeeds, progress shown |
| 22 | `/reports` | Click Generate Report | PDF generated, appears in list |
| 23 | `/reports` | Click Download PDF | PDF downloads |
| 24 | `/admin` | Check Audit Log card | Shows real count from VPS |
| 25 | `/admin` | Check LLM Budget card | Shows real spend from VPS |
| 26 | `/hunt` | Type search query | Real flows returned |
| 27 | `/hunt` | Click Export CSV | CSV file downloads |
| 28 | All protected pages | Remove token, reload | Redirects to /login |

---

## 7. Architecture Compliance

All changes must comply with:

1. **No Tailwind CSS** — Vanilla CSS + CSS Variables only ✅
2. **JetBrains Mono for data** — `var(--font-data)` for all metrics, IPs, scores ✅
3. **Inter for UI** — `var(--font-ui)` for labels, descriptions ✅
4. **Outfit for headings** — `var(--font-heading)` for page titles ✅
5. **GlassPanel containers** — All card/panel containers use GlassPanel ✅
6. **Dark theme** — Deep Space palette with glassmorphism ✅
7. **Design system tokens** — All colors use CSS variables ✅
8. **No prohibited technologies** — No Kafka, K8s, Elasticsearch, MongoDB ✅
9. **Ensemble weights locked** — Frontend displays, never modifies ✅
10. **10 modules only** — No new routes/modules added ✅

---

_Day 18 Plan — Frontend Overhaul & VPS Integration_
_To be appended to worklog after completion_
