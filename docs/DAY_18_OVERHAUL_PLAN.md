# ThreatMatrix AI — Frontend Full Overhaul Plan

> **Scope:** Architecture compliance, CSS polish, endpoint verification, component audit
> **Goal:** Every page displays live data, every CSS reference resolves, every component follows the design system

---

## Issue Summary (35 issues found)

| Category | Count | Critical | High | Low |
|----------|-------|----------|------|-----|
| Missing CSS definitions | 7 | 3 | 4 | 0 |
| Hardcoded values (should be CSS vars) | 5 | 0 | 2 | 3 |
| Component architecture | 3 | 0 | 3 | 0 |
| Type safety (`any` types) | 4 | 0 | 1 | 3 |
| Endpoint issues | 3 | 1 | 1 | 1 |
| SSR / hydration | 1 | 0 | 1 | 0 |
| Security (XSS) | 1 | 1 | 0 | 0 |
| State handling (loading/empty/error) | 7 | 0 | 4 | 3 |

---

## TIER 1: Missing CSS Definitions (breaks rendering)

These CSS classes and animations are referenced by components but **not defined** in `globals.css`. They silently fail — no visual effect.

### 1.1 `--radius-pill` (TopBar.tsx line ~141)
**Impact:** Top bar border-radius falls back to initial/normal — not pill-shaped.
**Fix:** Add to `:root` in globals.css:
```css
--radius-pill: 9999px;  /* alias for --radius-full */
```

### 1.2 `slideInRight` animation (NotificationToast.tsx)
**Impact:** Toast notifications appear instantly with no slide-in animation.
**Fix:** Add to keyframes in globals.css:
```css
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

### 1.3 `blink` keyframe (AIBriefingWidget.tsx line ~150)
**Impact:** Streaming cursor doesn't blink. The CSS defines `blink-cursor` but the component references `blink`.
**Fix:** Change component from `animation: 'blink 1s step-end infinite'` to `animation: 'blink-cursor 1s step-end infinite'`

### 1.4 `.cursor` CSS class (ChatInterface.tsx)
**Impact:** AI Analyst streaming cursor has no styling.
**Fix:** Add to globals.css:
```css
.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--cyan);
  animation: blink-cursor 1s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
}
```

### 1.5 `.action-button-hover` class (QuickActions.tsx line ~49)
**Impact:** Quick action buttons have no hover effect.
**Fix:** Add to globals.css:
```css
.action-button:hover {
  border-color: var(--cyan);
  color: var(--cyan);
}
```
Or change component to use inline hover via `onMouseEnter`/`onMouseLeave`.

### 1.6 `alert-card` / `alert-card--critical` (LiveAlertFeed.tsx line ~122)
**Impact:** Critical alert cards have no distinct visual treatment (no red left border, no pulse).
**Fix:** Add to globals.css:
```css
.alert-card {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  transition: all var(--transition-fast);
}
.alert-card--critical {
  border-left-color: var(--critical);
  animation: severity-breathe 4s ease-in-out infinite;
}
.alert-card--high {
  border-left-color: var(--high);
}
```

### 1.7 `--bg-dark` referenced but not defined (several components)
**Impact:** Button text color falls back to black (wrong on dark theme).
**Fix:** Add to `:root`:
```css
--bg-dark: hsl(228 28% 3%);
```

---

## TIER 2: Hardcoded Values (design system violations)

### 2.1 ThreatMap.tsx — FULL REWRITE NEEDED
**Issues (6):**
- No GlassPanel wrapper (uses raw `<div>`)
- Hardcoded fonts: `'"JetBrains Mono", monospace'` (3 locations)
- Hardcoded colors: `'#00f0ff'`, `'#ef4444'`, `'#e2e8f0'`, `'#94a3b8'`, `'#f59e0b'` (10+ locations)
- No loading/empty/error states
- `any` type for Deck.gl hover handler
- Missing `loading` prop

**Fix:** Rewrite the component header section to use GlassPanel, replace all hardcoded strings with CSS vars, add loading skeleton.

### 2.2 ProtocolChart.tsx — Font hardcoding
**Issues:** 4 instances of `'"JetBrains Mono", monospace'` hardcoded.
**Fix:** Replace with `var(--font-data)`.

### 2.3 GeoDistribution.tsx — Font hardcoding
**Issues:** 2 instances of `'"JetBrains Mono", monospace'` hardcoded.
**Fix:** Replace with `var(--font-data)`.

### 2.4 NotificationToast.tsx — Hardcoded z-index and background
**Issues:**
- `zIndex: 9999` should be `var(--z-notification)`
- Background `rgba(17,17,24,0.95)` should use CSS var
**Fix:** Replace with `zIndex: 'var(--z-notification)'` and `background: 'var(--bg-secondary)'` with opacity.

### 2.5 ErrorBanner.tsx — Hardcoded RGB colors
**Issues:** Background uses `rgba(239,68,68,...)` instead of `var(--critical-dim)`.
**Fix:** Replace with `var(--critical-dim)` for background, `var(--critical)` for border.

---

## TIER 3: Component Architecture Issues

### 3.1 ThreatLevel.tsx — Raw div instead of GlassPanel
**Issue:** Uses `<div className="glass-panel-static">` instead of `<GlassPanel static>`.
**Fix:** Import GlassPanel and replace. This adds noise overlay and consistent behavior.

### 3.2 GlassPanel.tsx — Severity type mismatch
**Issue:** `severity` prop uses `'critical' | 'high' | 'warning' | 'safe' | 'info'` but the global `Severity` type uses `'critical' | 'high' | 'medium' | 'low' | 'info'`.
**Fix:** Align GlassPanel's `severity` prop to use the global `Severity` type. Update `SEVERITY_SPOTLIGHT` mapping.

### 3.3 Sidebar.tsx — Route matching too broad
**Issue:** `pathname.startsWith(item.href)` matches `/alerts-test` for `/alerts`.
**Fix:** Change to `pathname === item.href || pathname.startsWith(item.href + '/')`.

---

## TIER 4: Type Safety Issues

### 4.1 AlertDetailDrawer.tsx — `any` types
- `onUpdateStatus: (id: string, status: any)` → change to `status: AlertStatus`
- `ActionButton` props typed as `any` → define interface

### 4.2 ThreatMap.tsx — `any` for Deck.gl callback
- `onHover: (info: any)` → type as `PickingInfo<GeoFlow>`

### 4.3 DataTable.tsx — `T extends any`
- Change `<T extends any>` to `<T>`

### 4.4 LiveAlertFeed.tsx — Redundant cast
- `lastAlertEvent.severity as Severity` → remove `as Severity` (already typed correctly)

---

## TIER 5: Endpoint Issues

### 5.1 hunt/page.tsx line 57 — Missing trailing slash
**Issue:** Direct API call uses `/api/v1/flows` (no trailing slash) while services layer uses `/api/v1/flows/`.
**Fix:** Change to `/api/v1/flows/` for consistency, or use `flowService.list()` instead.

### 5.2 reports/page.tsx line 98 — Hardcoded base URL
**Issue:** Download handler hardcodes `'http://187.124.45.161:8000'` instead of using `API_BASE_URL`.
**Fix:** Import `API_BASE_URL` from constants and use it.

### 5.3 intel/page.tsx lines 56, 72 — Direct fetch bypasses api wrapper
**Issue:** Lookup and sync use raw `fetch()` with manual auth headers instead of `api.get()`/`api.post()`.
**Fix:** Refactor to use `api.get()` and `api.post()` for consistency and automatic token refresh.

---

## TIER 6: Security

### 6.1 AlertDetailDrawer.tsx — dangerouslySetInnerHTML with regex sanitization
**Issue:** AI narrative is rendered via regex-based markdown-to-HTML conversion with basic script tag stripping. This is an XSS risk.
**Fix:** Either:
- (a) Use DOMPurify library: `import DOMPurify from 'dompurify'; const clean = DOMPurify.sanitize(html);`
- (b) Render as plain text (lose markdown formatting but eliminate XSS risk)

---

## TIER 7: State Handling Gaps

| Component | Loading | Empty | Error |
|-----------|---------|-------|-------|
| LiveAlertFeed | ❌ | ❌ (seeds mock) | ❌ |
| AIBriefingWidget | ❌ (implicit) | ❌ (falls back to mock) | ❌ |
| ThreatMap | ❌ | ❌ (seeds mock) | ❌ |
| GeoDistribution | ❌ | ❌ | ❌ |
| ThreatLevel | ⚠️ text only | ❌ | ❌ |
| TopTalkers | ✅ | ❌ | ❌ |
| ProtocolChart | ✅ | ❌ | ❌ |

**Minimum fix:** Add empty state message (`<EmptyState />` component exists) when data array is empty.

---

## Execution Order

| Step | Task | Files | Priority | Est. |
|------|------|-------|----------|------|
| 1 | Add missing CSS definitions (#1.1-1.7) | globals.css | 🔴 | 10 min |
| 2 | Fix AIBriefingWidget blink keyframe (#1.3) | AIBriefingWidget.tsx | 🔴 | 2 min |
| 3 | Fix ThreatMap — GlassPanel + CSS vars (#2.1) | ThreatMap.tsx | 🔴 | 20 min |
| 4 | Fix ProtocolChart/GeoDistribution fonts (#2.2-2.3) | ProtocolChart.tsx, GeoDistribution.tsx | 🟡 | 5 min |
| 5 | Fix Sidebar route matching (#3.3) | Sidebar.tsx | 🟡 | 2 min |
| 6 | Fix GlassPanel severity type (#3.2) | GlassPanel.tsx | 🟡 | 5 min |
| 7 | Fix ThreatLevel to use GlassPanel (#3.1) | ThreatLevel.tsx | 🟡 | 5 min |
| 8 | Fix AlertDetailDrawer types + XSS (#4.1, #6.1) | AlertDetailDrawer.tsx | 🟡 | 15 min |
| 9 | Fix hunt trailing slash + reports hardcoded URL (#5.1-5.2) | hunt/page.tsx, reports/page.tsx | 🟡 | 5 min |
| 10 | Fix DataTable, LoadingState, NotificationToast (#4.3, #2.4) | DataTable.tsx, LoadingState.tsx, NotificationToast.tsx | 🟢 | 5 min |
| 11 | Fix LiveAlertFeed redundant cast + missing CSS (#4.4, #1.6) | LiveAlertFeed.tsx | 🟢 | 3 min |
| 12 | Fix ErrorBanner hardcoded colors (#2.5) | ErrorBanner.tsx | 🟢 | 2 min |
| 13 | Refactor intel direct fetch to use api wrapper (#5.3) | intel/page.tsx | 🟢 | 10 min |
| 14 | TypeScript verification | — | 🟢 | 5 min |
| **Total** | | | | **~90 min** |

---

## Architecture Compliance Checklist

| Rule | Status | Notes |
|------|--------|-------|
| No Tailwind CSS | ✅ | Vanilla CSS + CSS Variables throughout |
| JetBrains Mono for data | ⚠️ | Correct in most places; ThreatMap/ProtocolChart/GeoDistribution hardcode it |
| Inter for UI text | ✅ | `var(--font-ui)` used for labels |
| Outfit for headings | ✅ | `var(--font-heading)` used for page titles |
| CSS Variables for colors | ⚠️ | Mostly correct; ThreatMap hardcodes 10+ hex colors |
| GlassPanel containers | ⚠️ | 9/10 components use GlassPanel; ThreatMap does not |
| Dark theme | ✅ | Deep Space palette with glassmorphism |
| No prohibited technologies | ✅ | No Kafka, K8s, Elasticsearch, MongoDB |
| Ensemble weights locked | ✅ | Frontend displays only, never modifies |
| 10 modules only | ✅ | 10 routes exactly |

---

_Full Overhaul Plan — Frontend Architecture Compliance_
_To be executed immediately after plan approval_
