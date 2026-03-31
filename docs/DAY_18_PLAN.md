# Day 18 — Progress & Remaining Tasks

## State as of March 31

All Day 18 tasks from the plan are **complete**. Below is a summary of what was done and what remains for the next session.

---

## Completed (Verified on Local)

| Task | Status | Files Changed |
|------|--------|---------------|
| Forensics → Live API (upload-pcap) | ✅ | `frontend/app/forensics/page.tsx` (committed) |
| Reports → Live API (generate/list/download) | ✅ | `frontend/app/reports/page.tsx` (uncommitted) |
| Hunt → Live API (flow search) | ✅ | `frontend/app/hunt/page.tsx` (uncommitted) |
| Admin → Live data (audit-log, budget) | ✅ | `frontend/app/admin/page.tsx` (uncommitted) |
| ML Ops — Remove hardcoded data | ✅ | `frontend/app/ml-ops/page.tsx` (uncommitted) |
| CSS — page-container, @keyframes spin, focus-visible | ✅ | `frontend/app/globals.css` (committed) |
| AuthGuardWrapper implementation | ✅ | `frontend/components/auth/AuthGuardWrapper.tsx` (committed) |
| APP_VERSION → v0.5.0 | ✅ | `frontend/lib/constants.ts` (uncommitted) |
| .env.local (VPS backend URL) | ✅ | `frontend/.env.local` (not tracked) |
| TypeScript — passes (only pre-existing Sentinel3D issue) | ✅ | — |

## Pending VPS Verification

These need to be tested in the browser against the live VPS:

- [ ] Forensics: upload a .pcap file → verify it reaches VPS
- [ ] Reports: generate a PDF → verify it downloads
- [ ] Hunt: search for flows → verify API returns results
- [ ] Admin: check audit log count + LLM budget from VPS
- [ ] All pages: verify AuthGuard redirects to /login when no token
- [ ] War Room: verify metric cards show live WebSocket data
- [ ] ML Ops: verify retrain button triggers VPS retrain + polling

## Uncommitted Changes

```
frontend/app/admin/page.tsx    — Admin wired to live APIs
frontend/app/hunt/page.tsx     — Hunt wired to flow search
frontend/app/ml-ops/page.tsx   — Training history from API
frontend/app/reports/page.tsx  — Reports wired to generate/download
frontend/lib/constants.ts      — APP_VERSION = v0.5.0
```

To commit:
```bash
git add frontend/app/admin/page.tsx frontend/app/hunt/page.tsx frontend/app/ml-ops/page.tsx frontend/app/reports/page.tsx frontend/lib/constants.ts
git commit -m "Day 18: Wire Forensics, Reports, Hunt, Admin, ML Ops to VPS backend APIs"
```

## Known Limitations (Accepted)

| Issue | Status | Reason |
|-------|--------|--------|
| TrafficTimeline shows mock data | Accepted | Backend has no timeline endpoint; component has built-in mock fallback that renders realistic chart |
| GeoDistribution is static | Accepted | Geo IP lookup would require MaxMind GeoIP database on VPS — not in v0.5.0 scope |
| AuthGuardWrapper currently enabled | **User requested disable** | See next action |

## Next Action

User requested temporarily disabling AuthGuardWrapper. Change `frontend/components/auth/AuthGuardWrapper.tsx` to pass-through:

```typescript
'use client';
export function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```
