# ThreatMatrix AI — Day 18 Deep Implementation Plan

> **Created:** April 3, 2026
> **Based on:** Analysis of DAY_18_PLAN.md vs. Actual Codebase State
> **Status:** CRITICAL REVISION — Most items already completed

---

## Executive Summary

After thorough analysis of the actual codebase, **the DAY_18_PLAN.md is significantly outdated**. Most of the "bugs" and "missing features" it describes have **ALREADY been fixed** in previous development sessions. The actual remaining work is substantially less than the planned 5.5 hours.

### Plan vs. Reality Comparison

| Plan Item | Plan Status | Actual Status | Action Needed |
|-----------|-------------|---------------|---------------|
| AuthGuardWrapper is no-op | 🔴 Critical | ⚠️ Still no-op (intentional for dev) | Restore for production |
| Missing `page-container` CSS | 🔴 Critical | ✅ Already exists in globals.css | None |
| Missing `@keyframes spin` | 🔴 Critical | ✅ Already exists in globals.css | None |
| Missing focus ring styles | 🔴 Critical | ✅ Already exists in globals.css | None |
| Forensics uses mock data | 🔴 Critical | ✅ Already wired to live APIs | None |
| Reports uses mock data | 🔴 Critical | ✅ Already wired to live APIs | None |
| Hunt uses mock data | 🔴 Critical | ✅ Already wired to live APIs | None |
| Admin uses mock data | 🔴 Critical | ✅ Already wired to live APIs | None |
| ML Ops hardcoded data | 🔴 Critical | ✅ Already wired to live APIs | None |
| APP_VERSION is 'v0.1.0' | 🟡 High | ✅ Already 'v0.5.0' | None |
| TrafficTimeline empty data | 🟡 High | ⚠️ Still passes `data={[]}` | Fix needed |
| GeoDistribution static | 🟡 High | ⚠️ Still static | Fix needed |
| CSS polish pass | 🟢 Low | ⚠️ Minor gaps | Optional |

---

## Actual Remaining Work (Revised)

### Priority 1: Critical Fixes (~30 min)

#### 1.1 Restore AuthGuardWrapper
**File:** `frontend/components/auth/AuthGuardWrapper.tsx`

**Current State:**
```typescript
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Issue:** This is intentionally disabled for development but needs to be restored for production.

**Fix:** Restore the full implementation:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Allow login page to render without auth
    if (pathname === '/login') {
      setAuthorized(true);
      return;
    }

    // Check for auth token
    const token = localStorage.getItem('tm_access_token');
    if (!token) {
      setAuthorized(false);
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  // Show nothing while checking
  if (authorized === null) return null;
  if (!authorized) return null;

  return <>{children}</>;
}
```

**Verification:**
- [ ] AuthGuard redirects unauthenticated users to /login
- [ ] Login page renders without auth
- [ ] Protected pages require authentication

---

### Priority 2: TrafficTimeline & GeoDistribution Fixes (~45 min)

#### 2.1 Fix TrafficTimeline Empty Data

**Issue:** Pages pass `data={[]}` to TrafficTimeline, causing it to fall back to mock data.

**Root Cause Analysis:**
- `FlowStatsResponse` type does NOT contain timeline data (no `timeline: FlowTimeline[]` field)
- The backend `/api/v1/flows/stats` endpoint returns aggregated stats, not time-bucketed timeline
- `TrafficTimeline` component has a `MOCK_DATA` fallback that works but shows fake data

**Solution Options:**

**Option A: Build Client-Side Timeline (Recommended)**
Transform the `flows` array from `useFlows` into timeline data by grouping flows into 1-minute buckets:

```typescript
// In network/page.tsx and war-room/page.tsx
const buildTimelineFromFlows = (flows: NetworkFlow[]): FlowTimeline[] => {
  const now = Date.now();
  const buckets = new Map<string, FlowTimeline>();

  // Initialize 60 one-minute buckets
  for (let i = 59; i >= 0; i--) {
    const ts = new Date(now - i * 60_000).toISOString().slice(0, 16);
    buckets.set(ts, {
      timestamp: new Date(now - i * 60_000).toISOString(),
      packets_per_second: 0,
      bytes_per_second: 0,
      active_flows: 0,
      anomaly_count: 0,
    });
  }

  // Populate buckets from flows
  flows.forEach((flow) => {
    const ts = flow.timestamp.slice(0, 16);
    const bucket = buckets.get(ts);
    if (bucket) {
      bucket.packets_per_second += flow.total_packets ?? 0;
      bucket.bytes_per_second += flow.total_bytes ?? 0;
      bucket.active_flows += 1;
      if (flow.is_anomaly) bucket.anomaly_count += 1;
    }
  });

  return Array.from(buckets.values());
};

// Usage:
const timelineData = buildTimelineFromFlows(flows);
<TrafficTimeline data={timelineData} loading={loading} />
```

**Option B: Accept Mock Fallback**
The `TrafficTimeline` component already handles empty data gracefully with mock data. This is acceptable for demo purposes but not for production.

**Recommended:** Option A for production, Option B acceptable for demo.

**Files to modify:**
- `frontend/app/war-room/page.tsx`
- `frontend/app/network/page.tsx`

#### 2.2 Fix GeoDistribution Static Data

**Issue:** `GeoDistribution` component is rendered without props.

**Investigation needed:**
- Check if `GeoDistribution` component accepts props
- Check if there's a geo API endpoint available
- If no API exists, either make the component fetch data internally or accept mock data

**Files to investigate:**
- `frontend/components/war-room/GeoDistribution.tsx`
- Backend API for geo data

---

### Priority 3: Optional CSS Polish (~15 min)

#### 3.1 Admin Card Hover Effect
**File:** `frontend/app/globals.css`

Add hover lift effect for admin cards:
```css
.glass-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

**Note:** The existing `.glass-panel` already has hover effects defined. This may already work.

---

## Revised Execution Plan

| Step | Task | Duration | Priority |
|------|------|----------|----------|
| 1 | Restore AuthGuardWrapper | 15 min | Critical |
| 2 | Fix TrafficTimeline data (client-side timeline) | 30 min | High |
| 3 | Investigate & Fix GeoDistribution | 15 min | High |
| 4 | Verify CSS polish (admin cards) | 5 min | Low |
| 5 | Run TypeScript check | 5 min | Low |
| **Total** | | **~70 min** | |

---

## Verification Checklist

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Remove token, reload protected page | Redirects to /login |
| 2 | Login page renders without auth | No redirect loop |
| 3 | War Room TrafficTimeline | Shows real flow data (not mock spikes) |
| 4 | Network TrafficTimeline | Shows real flow data (not mock spikes) |
| 5 | GeoDistribution | Shows real geo data or graceful fallback |
| 6 | Admin cards | Hover lift effect works |
| 7 | `pnpm tsc --noEmit` | 0 TypeScript errors |

---

## Architecture Compliance

All changes must comply with:
1. **No Tailwind CSS** — Vanilla CSS + CSS Variables only ✅
2. **JetBrains Mono for data** — `var(--font-data)` for all metrics ✅
3. **Inter for UI** — `var(--font-ui)` for labels ✅
4. **Outfit for headings** — `var(--font-heading)` for page titles ✅
5. **GlassPanel containers** — All card/panel containers use GlassPanel ✅
6. **Dark theme** — Deep Space palette with glassmorphism ✅
7. **Design system tokens** — All colors use CSS variables ✅
8. **No prohibited technologies** — No Kafka, K8s, Elasticsearch, MongoDB ✅
9. **Ensemble weights locked** — Frontend displays, never modifies ✅
10. **10 modules only** — No new routes/modules added ✅

---

## Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `frontend/components/auth/AuthGuardWrapper.tsx` | Route protection | Needs restore |
| `frontend/app/war-room/page.tsx` | War Room dashboard | Needs timeline fix |
| `frontend/app/network/page.tsx` | Network flow analysis | Needs timeline fix |
| `frontend/components/war-room/TrafficTimeline.tsx` | Timeline chart | Already good |
| `frontend/components/war-room/GeoDistribution.tsx` | Geo map | Needs investigation |
| `frontend/app/globals.css` | Design system CSS | Already complete |
| `frontend/lib/constants.ts` | Global constants | Already v0.5.0 |

---

_Day 18 Deep Implementation Plan — Revised based on actual codebase analysis_