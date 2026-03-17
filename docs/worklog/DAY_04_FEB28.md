# Day 4 Task Workflow — Friday, Feb 28, 2026

> **Sprint:** 1 (Foundation) | **Phase:** Redis Integration & Frontend Shell  
> **Owner:** Lead Architect + Full-Stack Dev | **Status:** 🟡 Ready to Start  
> **Goal:** Redis pub/sub operational, Next.js frontend shell with sidebar navigation, all 10 module stub pages

---

## Day 4 Objective

Complete the real-time communication layer and frontend navigation so that by end of day:

- Redis connection established and pub/sub test verified
- Next.js frontend shell: sidebar navigation with icon-only design
- All 10 module pages created as stub pages
- Navigation working with active state highlighting
- TopBar with threat level indicator, notifications, user menu
- StatusBar with system status footer
- Dark theme War Room design language applied

---

## Scope Adherence Checklist

> **STRICT RULE:** Every task below MUST adhere to the master documentation specifications. No features outside the defined scope.

| Requirement | Source Document | Section |
|-------------|-----------------|---------|
| Redis 7 for pub/sub | GLOBAL_CONTEXT.md | §2 (Technology Stack) |
| Next.js 16 App Router | GLOBAL_CONTEXT.md | §2 |
| TypeScript strict mode | GLOBAL_CONTEXT.md | §9 (Rule #9) |
| Dark theme only | GLOBAL_CONTEXT.md | §9 (Rule #10) |
| Glassmorphism UI | GLOBAL_CONTEXT.md | §9 (Rule #10) |
| Cyan accents (#00f0ff) | GLOBAL_CONTEXT.md | §9 |
| 10 modules only | GLOBAL_CONTEXT.md | §5 |
| Sidebar icon-only design | MASTER_DOC_PART5 | §2.1 (Sidebar.tsx) |
| War Room / Intel Agency vibe | GLOBAL_CONTEXT.md | §9 (Rule #10) |

---

## Task Breakdown

### TASK 1 — Redis Connection & Pub/Sub Test 🔨

**Time Est:** 30 min | **Priority:** 🔴 Critical

Set up Redis connection manager and verify pub/sub functionality.

#### 1.1 Redis Client (`backend/app/redis.py`)

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| `RedisManager` | Connection manager | `redis.asyncio` client |
| `connect()` | Establish connection | Pool with health check |
| `publish()` | Publish to channel | `await redis.publish(channel, message)` |
| `subscribe()` | Subscribe to channel | `await redis.subscribe(channel)` |
| `get/set` | Cache operations | For LLM response caching |

**Key Implementation Points:**
- Use `redis.asyncio` for async operations (matches FastAPI async pattern)
- Connection URL from `settings.REDIS_URL`
- Connection pooling with `max_connections=20`
- Health check ping on startup
- Graceful shutdown on app termination

**Channels to Define:**
| Channel | Purpose | Publisher | Subscriber |
|---------|---------|-----------|------------|
| `flows:live` | Real-time flow data | Capture Engine | ML Worker, WebSocket |
| `alerts:live` | New/updated alerts | Alert Engine | WebSocket |
| `system:status` | System metrics | Backend | WebSocket |

**Verification:**
```bash
cd backend && python -c "
import asyncio
import redis.asyncio as redis

async def test():
    r = redis.from_url('redis://localhost:6379')
    await r.set('test_key', 'hello')
    val = await r.get('test_key')
    print('[OK] Redis get/set:', val.decode())
    await r.delete('test_key')
    await r.close()

asyncio.run(test())
"
```

**Expected Output:**
```
[OK] Redis get/set: hello
```

---

### TASK 2 — Redis Integration in FastAPI 🔨

**Time Est:** 20 min | **Priority:** 🔴 Critical

Integrate Redis into the FastAPI application lifecycle.

#### 2.1 Update Main App (`backend/app/main.py`)

| Change | Purpose |
|--------|---------|
| Add Redis to lifespan | Connect on startup, disconnect on shutdown |
| Add Redis dependency | `get_redis()` for endpoint access |
| Health check integration | Include Redis status in `/system/health` |

**Lifespan Pattern:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    redis_manager = RedisManager(settings.REDIS_URL)
    await redis_manager.connect()
    app.state.redis = redis_manager
    
    yield
    
    # Shutdown
    await redis_manager.disconnect()
```

**Verification:**
```bash
cd backend && python -c "
from app.main import app
print('[OK] App has redis_manager:', hasattr(app.state, 'redis_manager'))
"
```

---

### TASK 3 — Next.js Frontend Shell: Root Layout 🔨

**Time Est:** 45 min | **Priority:** 🔴 Critical

Create the root layout with sidebar, topbar, and statusbar.

#### 3.1 Root Layout (`frontend/app/layout.tsx`)

**Structure (per MASTER_DOC_PART5 §2.1):**
```
┌─────────────────────────────────────────┐
│ Sidebar │ TopBar                        │
│ (icon)  ├───────────────────────────────┤
│         │ Main Content (scrollable)     │
│         ├───────────────────────────────┤
│         │ StatusBar                     │
└─────────────────────────────────────────┘
```

**Key Elements:**
- Import `globals.css` for design system
- Set `lang="en"` on `<html>`
- Apply dark theme class to `<body>`
- Grid layout: sidebar (64px) + main content
- Font imports: JetBrains Mono, Inter

**Verification:**
```bash
cd frontend && npm run build 2>&1 | grep -E "(error|Error)" || echo "[OK] Build successful"
```

---

### TASK 4 — Sidebar Navigation Component 🔨

**Time Est:** 60 min | **Priority:** 🔴 Critical

Create icon-only sidebar with navigation to all 10 modules.

#### 4.1 Sidebar Component (`frontend/components/layout/Sidebar.tsx`)

**Design Specifications (per GLOBAL_CONTEXT.md §9):**
- Width: 64px (icon-only)
- Background: `#111118` (panel color)
- Border: `rgba(255, 255, 255, 0.06)`
- Active state: cyan glow (`#00f0ff`)
- Icons: Lucide React

**Navigation Items (10 modules):**

| Icon | Label | Route | Priority |
|------|-------|-------|----------|
| `Shield` | War Room | `/war-room` | P0 |
| `Search` | Threat Hunt | `/hunt` | P0 |
| `Globe` | Intel Hub | `/intel` | P0 |
| `Network` | Network Flow | `/network` | P0 |
| `Bot` | AI Analyst | `/ai-analyst` | P0 |
| `Bell` | Alert Console | `/alerts` | P1 |
| `FileSearch` | Forensics Lab | `/forensics` | P1 |
| `Brain` | ML Operations | `/ml-ops` | P1 |
| `FileText` | Reports | `/reports` | P1 |
| `Settings` | Administration | `/admin` | P2 |

**Active State Logic:**
- Use `usePathname()` from `next/navigation`
- Match current route to nav item
- Apply `.active` class with cyan glow effect

**Verification:**
```bash
cd frontend && npm run build 2>&1 | grep -E "(error|Error)" || echo "[OK] Sidebar component builds"
```

---

### TASK 5 — TopBar Component 🔨

**Time Est:** 30 min | **Priority:** 🔴 Critical

Create top bar with threat level, notifications, and user menu.

#### 5.1 TopBar Component (`frontend/components/layout/TopBar.tsx`)

**Elements:**
| Element | Description | Style |
|---------|-------------|-------|
| Threat Level Indicator | DEFCON-style gauge (1-5) | Color-coded: red→yellow→green |
| Notification Bell | Alert count badge | Cyan accent |
| User Menu | Avatar + dropdown | Glass panel |
| Search Icon | Global search trigger | Future implementation |

**Threat Levels:**
| Level | Color | Meaning |
|-------|-------|---------|
| 1 - CRITICAL | `#ef4444` | Active attack detected |
| 2 - HIGH | `#f97316` | Multiple anomalies |
| 3 - ELEVATED | `#eab308` | Suspicious activity |
| 4 - GUARDED | `#22c55e` | Normal operations |
| 5 - LOW | `#00f0ff` | All clear |

**Verification:**
```bash
cd frontend && npm run build 2>&1 | grep -E "(error|Error)" || echo "[OK] TopBar component builds"
```

---

### TASK 6 — StatusBar Component 🔨

**Time Est:** 15 min | **Priority:** 🟡 Medium

Create system status footer bar.

#### 6.1 StatusBar Component (`frontend/components/layout/StatusBar.tsx`)

**Elements:**
| Element | Description |
|---------|-------------|
| Connection Status | WebSocket connected/disconnected indicator |
| Capture Status | Engine running/stopped |
| Last Update | Timestamp of last data refresh |
| Version | App version number |

**Style:**
- Height: 32px
- Background: `#0a0a0f` (base)
- Font: JetBrains Mono (monospace)
- Text color: `#64748b` (muted)

**Verification:**
```bash
cd frontend && npm run build 2>&1 | grep -E "(error|Error)" || echo "[OK] StatusBar component builds"
```

---

### TASK 7 — All 10 Module Stub Pages 🔨

**Time Est:** 30 min | **Priority:** 🔴 Critical

Create stub pages for all 10 modules with consistent structure.

#### 7.1 Page Structure

Each page should have:
- Metadata export (title, description)
- GlassPanel wrapper
- Page title with module name
- "Coming Soon" placeholder content

**Pages to Create:**

| # | File | Route | Title |
|---|------|-------|-------|
| 1 | `app/war-room/page.tsx` | `/war-room` | War Room |
| 2 | `app/hunt/page.tsx` | `/hunt` | Threat Hunt |
| 3 | `app/intel/page.tsx` | `/intel` | Intel Hub |
| 4 | `app/network/page.tsx` | `/network` | Network Flow |
| 5 | `app/ai-analyst/page.tsx` | `/ai-analyst` | AI Analyst |
| 6 | `app/alerts/page.tsx` | `/alerts` | Alert Console |
| 7 | `app/forensics/page.tsx` | `/forensics` | Forensics Lab |
| 8 | `app/ml-ops/page.tsx` | `/ml-ops` | ML Operations |
| 9 | `app/reports/page.tsx` | `/reports` | Reports |
| 10 | `app/admin/page.tsx` | `/admin` | Administration |

**Stub Page Template:**
```typescript
import { Metadata } from "next";
import { GlassPanel } from "@/components/shared/GlassPanel";

export const metadata: Metadata = {
  title: "Module Name — ThreatMatrix AI",
  description: "Module description",
};

export default function ModulePage() {
  return (
    <div className="page-container">
      <GlassPanel>
        <h1 className="page-title">Module Name</h1>
        <p className="text-muted">Module coming soon...</p>
      </GlassPanel>
    </div>
  );
}
```

**Verification:**
```bash
cd frontend && ls -la app/*/page.tsx | wc -l
# Expected: 10 (or 11 including root page.tsx)
```

---

### TASK 8 — Root Page Redirect 🔨

**Time Est:** 5 min | **Priority:** 🟡 Medium

Update root page to redirect to `/war-room`.

#### 8.1 Update `frontend/app/page.tsx`

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/war-room");
}
```

**Verification:**
```bash
cd frontend && npm run build 2>&1 | grep -E "(error|Error)" || echo "[OK] Root redirect builds"
```

---

### TASK 9 — Design System CSS Verification 🔨

**Time Est:** 15 min | **Priority:** 🟡 Medium

Verify globals.css has all required design tokens.

#### 9.1 Required CSS Variables (per GLOBAL_CONTEXT.md §9)

| Variable | Value | Purpose |
|----------|-------|---------|
| `--bg-primary` | `#0a0a0f` | Main background |
| `--bg-secondary` | `#111118` | Panel background |
| `--bg-tertiary` | `#1a1a24` | Card background |
| `--cyan` | `#00f0ff` | Primary accent |
| `--critical` | `#ef4444` | Critical alerts |
| `--high` | `#f97316` | High severity |
| `--safe` | `#22c55e` | Safe/normal |
| `--font-data` | `JetBrains Mono` | Data/metrics |
| `--font-ui` | `Inter` | UI labels |

**Verification:**
```bash
cd frontend && grep -E "(--bg-primary|--cyan|--critical|--font-data)" styles/globals.css | head -5
```

---

### TASK 10 — Full Stack Verification 🔨

**Time Est:** 15 min | **Priority:** 🔴 Critical

Verify all components work together.

#### 10.1 Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Frontend builds | `cd frontend && npm run build` | No errors |
| All pages exist | `ls app/*/page.tsx` | 10+ pages |
| Sidebar renders | Visual check at `localhost:3000` | Icon navigation visible |
| Navigation works | Click sidebar icons | Routes change, active state updates |
| Dark theme | Visual check | Dark background, cyan accents |
| Backend starts | `cd backend && uvicorn app.main:app` | No errors |
| Redis connects | Check `/api/v1/system/health` | Redis status: connected |

---

## Files Created/Modified Today

```
threatmatrix-ai/
├── backend/
│   ├── app/
│   │   ├── redis.py                  🔨 Task 1
│   │   └── main.py                   🔨 Task 2 (update)
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                🔨 Task 3 (verify/update)
│   │   ├── page.tsx                  🔨 Task 8 (update)
│   │   ├── war-room/page.tsx         🔨 Task 7
│   │   ├── hunt/page.tsx             🔨 Task 7
│   │   ├── intel/page.tsx            🔨 Task 7
│   │   ├── network/page.tsx          🔨 Task 7
│   │   ├── ai-analyst/page.tsx       🔨 Task 7
│   │   ├── alerts/page.tsx           🔨 Task 7
│   │   ├── forensics/page.tsx        🔨 Task 7
│   │   ├── ml-ops/page.tsx           🔨 Task 7
│   │   ├── reports/page.tsx          🔨 Task 7
│   │   └── admin/page.tsx            🔨 Task 7
│   └── components/
│       └── layout/
│           ├── Sidebar.tsx           🔨 Task 4
│           ├── TopBar.tsx            🔨 Task 5
│           └── StatusBar.tsx         🔨 Task 6
```

---

## Verification Checklist

> **Every item below MUST be verified before marking task complete.**

| # | Verification | Command | Expected Result |
|---|--------------|---------|-----------------|
| 1 | Redis connection | Test script | `[OK] Redis get/set: hello` |
| 2 | Frontend builds | `npm run build` | No errors |
| 3 | All 10 pages exist | `ls app/*/page.tsx` | 10+ pages |
| 4 | Sidebar renders | Visual check | Icon navigation visible |
| 5 | Navigation works | Click icons | Routes change, active state |
| 6 | Dark theme | Visual check | Dark bg, cyan accents |
| 7 | TopBar renders | Visual check | Threat level, notifications |
| 8 | StatusBar renders | Visual check | Connection status visible |
| 9 | Root redirect | Visit `/` | Redirects to `/war-room` |
| 10 | Design tokens | grep globals.css | All required vars present |

---

## Scope Adherence Verification

| Requirement | Source | Verification |
|-------------|--------|--------------|
| Redis 7 for pub/sub | GLOBAL_CONTEXT.md §2 | Check redis.asyncio usage |
| Next.js 16 App Router | GLOBAL_CONTEXT.md §2 | Check app/ directory structure |
| TypeScript strict mode | GLOBAL_CONTEXT.md §9 | Check tsconfig.json strict: true |
| Dark theme only | GLOBAL_CONTEXT.md §9 | Visual verification |
| Glassmorphism UI | GLOBAL_CONTEXT.md §9 | Check GlassPanel component |
| Cyan accents (#00f0ff) | GLOBAL_CONTEXT.md §9 | Check CSS variables |
| 10 modules only | GLOBAL_CONTEXT.md §5 | Count page.tsx files |
| Sidebar icon-only | MASTER_DOC_PART5 §2.1 | Check Sidebar.tsx width: 64px |
| War Room vibe | GLOBAL_CONTEXT.md §9 | Visual verification |

---

## Blockers

| Blocker | Severity | Mitigation | Status |
|---------|----------|------------|--------|
| Docker not running | 🟡 Medium | Redis can be tested via remote or wait for Docker fix | Mitigated |
| No live data yet | 🟢 Low | Use mock/placeholder data for UI verification | Expected |

---

## Tomorrow's Preview (Day 5)

- Design system components: GlassPanel, StatusBadge, MetricCard, DataTable
- Docker stack verification (if Docker fixed)
- API docs accessible at `/docs`
- Frontend connecting to backend API

---

_Task workflow for Day 4 — ThreatMatrix AI Sprint 1_
