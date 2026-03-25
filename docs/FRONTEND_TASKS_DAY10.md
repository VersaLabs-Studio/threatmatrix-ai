# ThreatMatrix AI — Frontend Tasks (Day 10-12)

> **Date:** 2026-03-24
> **Sprint:** 3 (ML Pipeline + Intelligence Integration)
> **Owner:** Full-Stack Dev
> **Goal:** Connect War Room to live ML-scored data, implement Alert Console, begin ML Operations page
> **Reference:** MASTER_DOC_PART3 §2-6, MASTER_DOC_PART5 §3 (Week 3-4 Plan)

---

## Current System Status (What Changed Since Day 8)

Since your Day 8 frontend tasks were issued, the Lead Architect has completed **major backend milestones** that unlock new frontend capabilities:

### New Backend Capabilities (Day 8-11)

| Feature | Status | What It Means for Frontend |
|---------|--------|--------------------------|
| **63 features per flow** | ✅ Live | More data available in flow detail views |
| **3 ML models trained** | ✅ Live | ML Operations page can now show real metrics |
| **Ensemble scoring (80.66% acc)** | ✅ Live | Anomaly scores available on every flow |
| **ML API endpoints** | ✅ Live | `GET /ml/models`, `GET /ml/comparison` return real data |
| **ML Worker (real-time inference)** | 🔨 Day 11 | Every flow will be scored — anomaly_score + is_anomaly columns populated |
| **Alert Engine (auto-creation)** | 🔨 Day 11 | ML-generated alerts appearing in database and on `alerts:live` WebSocket |
| **LLM Gateway scaffold** | 🔨 Day 11 | Prompt templates ready, API keys pending (Week 4) |
| **POST /ml/predict** | 🔨 Day 11 | Score arbitrary flows via API |

### API Endpoints Now Available (25 total)

```
AUTH:     POST /auth/login, /register, /refresh  |  GET /auth/me  |  POST /auth/logout
FLOWS:    GET /flows/, /flows/{id}, /flows/stats, /flows/top-talkers, /flows/protocols  |  POST /flows/search
ALERTS:   GET /alerts/, /alerts/{id}, /alerts/stats  |  PATCH /alerts/{id}/status, /alerts/{id}/assign
CAPTURE:  GET /capture/status, /capture/interfaces  |  POST /capture/start, /capture/stop
SYSTEM:   GET /system/health, /system/info
ML:       GET /ml/models, /ml/comparison  |  POST /ml/predict  ← NEW
WS:       WS /ws/
```

### WebSocket Channels

| Channel | Event | Payload | Status |
|---------|-------|---------|--------|
| `flows:live` | `new_flow` | Flow + 63 features | ✅ Active |
| `alerts:live` | `new_alert` | ML-generated alert with severity + scores | ✅ Active (Day 11) |
| `system:status` | `capture_status` | Engine stats | ✅ Active |
| `ml:live` | `anomaly_detected` | Flow + ensemble score | ✅ Active (Day 11) |

---

## VPS Connection (Unchanged)

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://187.124.45.161:8000
NEXT_PUBLIC_WS_URL=ws://187.124.45.161:8000
```

DEV_MODE is still enabled — no JWT required. Use `"dev-mode-bypass"` token for WebSocket.

---

## Task Breakdown

### TASK 1 — War Room: ML-Enriched MetricCards 🔴

**Priority:** Critical | **Time Est:** 30 min

**What changed:** Flows now have `anomaly_score` and `is_anomaly` fields. The "ANOMALY RATE" MetricCard should show the real anomaly percentage from ML scoring.

**Update `useFlows` or `war-room/page.tsx`:**

```typescript
// Fetch anomaly stats from the flows/stats endpoint
// The API now returns anomaly_count in stats
const anomalyRate = stats.length > 0
  ? ((stats[stats.length - 1].anomaly_count / stats[stats.length - 1].active_flows) * 100).toFixed(1)
  : '0.0';

// Or fetch directly:
// GET /api/v1/flows/stats → includes anomaly_count
```

**New MetricCard: ML Model Status**

Add a 5th metric card showing ML model status:

```typescript
// Fetch from GET /api/v1/ml/models
const mlModelsResponse = await api.get('/ml/models');
const modelsLoaded = mlModelsResponse.data.models.filter(m => m.trained).length;

<MetricCard
  title="ML MODELS"
  value={`${modelsLoaded}/3`}
  subtitle="Ensemble Active"
  icon={Brain}
  color="var(--cyan)"
/>
```

**Verification:**
| Check | Expected |
|-------|----------|
| ANOMALY RATE shows real percentage | Non-zero value |
| ML MODELS shows "3/3" | All models trained |
| MetricCards update on 3s polling | Values refresh |

---

### TASK 2 — War Room: LiveAlertFeed with ML Alerts 🔴

**Priority:** Critical | **Time Est:** 45 min

**What changed:** The ML Worker now auto-generates alerts when flows score > 0.30 composite. These appear on the `alerts:live` WebSocket channel AND in the database.

**Update the LiveAlertFeed component to display ML-generated alerts:**

```typescript
// WebSocket event payload from alerts:live channel:
interface MLAlert {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;        // 'ddos', 'port_scan', 'unauthorized_access', 'privilege_escalation', 'anomaly'
  title: string;           // "HIGH — probe detected"
  description: string;     // "ML ensemble detected probe activity. Composite score: 0.78. Model agreement: majority."
  source_ip: string;
  dest_ip: string;
  composite_score: number; // 0.0 - 1.0
  model_agreement: string; // 'unanimous', 'majority', 'single', 'none'
  rf_label: string;        // 'dos', 'probe', 'r2l', 'u2r', 'normal'
  rf_confidence: number;
  if_score: number;
  ae_score: number;
}
```

**Display requirements per PART3 §2.3:**
- Alert cards with severity color coding (critical=red, high=orange, medium=yellow, low=blue)
- Source → Destination IP displayed
- Composite score as percentage (e.g., "78% confidence")
- Model agreement badge ("UNANIMOUS" / "MAJORITY" / "SINGLE")
- Auto-scroll to newest alert
- Click to expand → shows full ML scores breakdown

**Verification:**
| Check | Expected |
|-------|----------|
| LiveAlertFeed shows ML-generated alerts | Real alerts from `alerts:live` |
| Severity colors match design system | Critical=red, High=orange |
| Composite score displayed | Percentage format |
| Model agreement badge visible | UNANIMOUS/MAJORITY/SINGLE |
| Auto-scroll on new alert | Feed scrolls down |

---

### TASK 3 — War Room: ThreatLevel with ML Data 🔴

**Priority:** Critical | **Time Est:** 15 min

**What changed:** Alerts now have real severity levels from ML scoring (not mock data).

**Update ThreatLevel gauge computation:**

```typescript
// GET /api/v1/alerts/stats now returns real ML-generated alert counts
const alertStats = await api.get('/alerts/stats');
// Response: { total: 45, critical: 3, high: 12, medium: 20, low: 10, by_category: {...} }

// Compute threat level from ML alert distribution
const threatLevel =
  alertStats.critical > 0 ? 'CRITICAL' :
  alertStats.high > 3 ? 'HIGH' :
  alertStats.medium > 10 ? 'ELEVATED' :
  'LOW';
```

**Verification:**
| Check | Expected |
|-------|----------|
| ThreatLevel reflects real ML alerts | Dynamic |
| Color changes with severity | Green→Amber→Red |

---

### TASK 4 — Alert Console Page (Full Implementation) 🔴

**Priority:** Critical | **Time Est:** 120 min

**Per MASTER_DOC_PART3 §6, the Alert Console needs:**

1. **Alert Table** — Sortable/filterable list of all alerts
2. **Severity Filter** — Critical/High/Medium/Low toggle buttons
3. **Category Filter** — DoS, Probe, R2L, U2R, Anomaly
4. **Alert Detail Drawer** — Slide-out panel with full alert info
5. **Status Management** — New → Acknowledged → Investigating → Resolved
6. **ML Scores Panel** — In alert detail, show composite + individual model scores

**API endpoints to use:**
```
GET  /api/v1/alerts/?severity=high&status=new&limit=50&offset=0
GET  /api/v1/alerts/{id}
PATCH /api/v1/alerts/{id}/status  → body: { "status": "acknowledged" }
PATCH /api/v1/alerts/{id}/assign  → body: { "user_id": "..." }
GET  /api/v1/alerts/stats
```

**Alert Table Columns:**
| Column | Source | Sort |
|--------|--------|:----:|
| Severity | `alert.severity` | ✅ |
| Category | `alert.category` | ✅ |
| Title | `alert.title` | — |
| Source IP | `alert.source_ip` | ✅ |
| Dest IP | `alert.destination_ip` | ✅ |
| Confidence | `alert.confidence` | ✅ |
| Status | `alert.status` | ✅ |
| Time | `alert.created_at` | ✅ |

**Alert Detail Drawer should display:**
```
┌─────────────────────────────────────┐
│ ⚠️ HIGH — Probe Detected           │
│ Category: port_scan                 │
│ Time: 2026-03-24 18:23:45 UTC       │
│                                     │
│ Source: 153.92.2.6 → 187.124.45.161 │
│                                     │
│ ML Scores:                          │
│ ┌──────────────────────────────┐    │
│ │ Composite:    0.78           │    │
│ │ IF Score:     0.65           │    │
│ │ RF Label:     probe (82%)   │    │
│ │ AE Score:     0.45           │    │
│ │ Agreement:    MAJORITY       │    │
│ └──────────────────────────────┘    │
│                                     │
│ Description:                        │
│ ML ensemble detected probe activity │
│ with majority model agreement.      │
│                                     │
│ Status: [NEW] [ACK] [INV] [RES]     │
└─────────────────────────────────────┘
```

**Design rules:**
- Use `GlassPanel` for the drawer
- Severity badge with color coding
- ML scores in a sub-panel with JetBrains Mono font
- Status buttons as pill-shaped toggles
- Table rows highlight on hover with subtle glow

**Verification:**
| Check | Expected |
|-------|----------|
| Alert table renders with ML alerts | Non-empty |
| Severity filter works | Reduces visible rows |
| Category filter works | Shows only selected category |
| Click row opens detail drawer | Slide-out animation |
| ML scores displayed in drawer | Composite + IF + RF + AE |
| Status update works | PATCH request succeeds |
| Table is sortable | Click column header sorts |
| Design matches War Room aesthetic | GlassPanel, dark theme |

---

### TASK 5 — ML Operations Page (New) 🟡

**Priority:** Medium | **Time Est:** 90 min

**Per MASTER_DOC_PART3 §8, the ML Operations page displays model status, training metrics, and performance comparison.**

**API endpoints to use:**
```
GET /api/v1/ml/models      → 3 models with eval results
GET /api/v1/ml/comparison   → Side-by-side comparison with best_accuracy/best_f1
```

**Page Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ ML OPERATIONS — Model Performance Dashboard              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Row 1: 4× ModelStatusCard                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│ │Isolation │ │ Random   │ │Auto-     │ │  Ensemble    │ │
│ │Forest    │ │ Forest   │ │encoder   │ │  (Combined)  │ │
│ │          │ │          │ │          │ │              │ │
│ │Acc:79.68%│ │Acc:74.16%│ │Acc:60.39%│ │ Acc: 80.66% │ │
│ │AUC:0.938 │ │AUC:0.958 │ │AUC:0.852 │ │ AUC: 0.931  │ │
│ │Status: ✅│ │Status: ✅│ │Status: ✅│ │ Status: ✅   │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│                                                          │
│ Row 2: Performance Comparison Chart (Recharts BarChart)  │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Bar chart comparing Accuracy, F1, AUC-ROC          │   │
│ │ across all 4 models (IF, RF, AE, Ensemble)         │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ Row 3: Feature Importance (Top 10) + Training Config     │
│ ┌──────────────────────────┐ ┌───────────────────────┐   │
│ │ Horizontal bar chart     │ │ Training Config       │   │
│ │ src_bytes ██████████ 11% │ │ Dataset: NSL-KDD      │   │
│ │ dst_host  ████████── 8%  │ │ Train: 125,973        │   │
│ │ dst_bytes ████████── 8%  │ │ Test: 22,544          │   │
│ │ service   ██████──── 7%  │ │ Features: 40          │   │
│ │ ...                      │ │ Classes: 5            │   │
│ └──────────────────────────┘ │ Time: 98s             │   │
│                              └───────────────────────┘   │
│                                                          │
│ Row 4: Confusion Matrix (RF) — Heatmap                   │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 5×5 heatmap: Normal/DoS/Probe/R2L/U2R             │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Data mapping from `/api/v1/ml/comparison`:**

```json
{
  "models": [
    {
      "model": "isolation_forest",
      "accuracy": 0.7968,
      "f1_score": 0.7875,
      "auc_roc": 0.9378
    },
    {
      "model": "random_forest",
      "accuracy": 0.7416,
      "f1_weighted": 0.6945,
      "auc_roc_ovr": 0.9576
    },
    {
      "model": "autoencoder",
      "accuracy": 0.6039,
      "f1_score": 0.5066,
      "auc_roc": 0.8517
    },
    {
      "model": "ensemble",
      "accuracy": 0.8066,
      "f1_score": 0.8087,
      "auc_roc": 0.9312
    }
  ],
  "best_accuracy": "ensemble",
  "best_f1": "ensemble"
}
```

**Data mapping from `/api/v1/ml/models`:**
```json
{
  "models": [
    {
      "name": "isolation_forest",
      "trained": true,
      "eval_results": {
        "accuracy": 0.7968,
        "precision": 0.9726,
        "recall": 0.6616,
        "f1_score": 0.7875,
        "auc_roc": 0.9378,
        "confusion_matrix": [[...], [...]]
      }
    }
    // ... 2 more models
  ]
}
```

**Components to create:**
- `components/ml-ops/ModelStatusCard.tsx` — GlassPanel card per model
- `components/ml-ops/PerformanceChart.tsx` — Recharts grouped bar chart
- `components/ml-ops/FeatureImportanceChart.tsx` — Horizontal bar chart
- `components/ml-ops/ConfusionMatrix.tsx` — Heatmap grid (can use Recharts ScatterChart or custom CSS grid)
- `components/ml-ops/TrainingConfig.tsx` — Static info panel

**Verification:**
| Check | Expected |
|-------|----------|
| 4 model cards render | IF, RF, AE, Ensemble |
| Accuracy/AUC values displayed | Real numbers from API |
| Trained status badge | ✅ green for all models |
| Bar chart shows comparison | 4 groups of bars |
| Feature importance shows top 10 | Horizontal bars |
| Ensemble highlighted as best | Visual emphasis |
| Page uses GlassPanel + design system | War Room aesthetic |

---

### TASK 6 — Network Flow Page (New) 🟡

**Priority:** Medium | **Time Est:** 60 min

**Per MASTER_DOC_PART3 §4, the Network Flow page shows:**

1. **Flow table** — Paginated list of network flows
2. **Search/filter** — By IP, protocol, port, anomaly status
3. **Flow detail** — Click to see full 63 features + ML score

**API endpoints:**
```
GET  /api/v1/flows/?limit=50&offset=0
GET  /api/v1/flows/{id}
POST /api/v1/flows/search → body: { "src_ip": "...", "protocol": "tcp" }
```

**Flow Table Columns:**
| Column | Source |
|--------|--------|
| Time | `flow.timestamp` |
| Source | `flow.src_ip:flow.src_port` |
| Destination | `flow.dst_ip:flow.dst_port` |
| Protocol | `flow.protocol` |
| Duration | `flow.duration` |
| Bytes | `flow.total_bytes` |
| Anomaly Score | `flow.anomaly_score` |
| Status | `flow.is_anomaly` (badge: Normal/Anomaly) |

**Flow Detail View (on click):**
- Two-column layout: Flow metadata (left) + ML Scores (right)
- Feature list in JetBrains Mono font
- Anomaly score gauge (0-100%)
- Source → Destination arc visualization (optional)

**Verification:**
| Check | Expected |
|-------|----------|
| Flow table renders | 50 rows per page |
| Pagination works | Next/Previous buttons |
| Click shows detail | Feature list visible |
| Anomaly badge shows | Red for `is_anomaly=true` |
| Search by IP works | Filters results |

---

### TASK 7 — WebSocket: Handle ML Events 🔴

**Priority:** Critical | **Time Est:** 30 min

**What changed:** Two new WebSocket channels are now active:

1. `alerts:live` → `new_alert` events with ML scoring data
2. `ml:live` → `anomaly_detected` events with ensemble scores

**Update `useWebSocket.ts` to handle new events:**

```typescript
// In the WebSocket message handler:
case 'new_alert':
  // ML-generated alert — update alert list + show notification
  setAlerts(prev => [message.payload, ...prev].slice(0, 100));
  showNotification({
    type: message.payload.severity,
    title: message.payload.title,
    message: `Score: ${(message.payload.composite_score * 100).toFixed(0)}%`,
  });
  break;

case 'anomaly_detected':
  // ML anomaly event — update flow highlighting
  setAnomalyEvents(prev => [message.payload, ...prev].slice(0, 50));
  break;
```

**Add notification toast component:**
- Appears top-right for 5 seconds
- Severity-colored border
- Sound ping for CRITICAL alerts (optional)

**Verification:**
| Check | Expected |
|-------|----------|
| `new_alert` events received | WebSocket messages in console |
| Alert notification toast appears | Top-right, auto-dismiss |
| Alert feed updates in real-time | No page refresh needed |
| `anomaly_detected` events received | ML scoring data in payload |

---

### TASK 8 — Sidebar: Badge Updates 🟡

**Priority:** Medium | **Time Est:** 15 min

**Update sidebar navigation to show real counts:**

```typescript
// Sidebar badges (per MASTER_DOC_PART3 §1.6):
// - Alert Console: Show unread alert count (critical + high)
// - ML Operations: Show "3/3" models trained
// - War Room: Pulsing dot if CRITICAL alert active

// Fetch from:
// GET /api/v1/alerts/stats → { total, critical, high, ... }
// GET /api/v1/ml/models → { count: 3 }
```

**Verification:**
| Check | Expected |
|-------|----------|
| Alert badge shows count | Red badge with number |
| ML badge shows model count | "3" or checkmark |
| War Room dot pulses on critical | Animated indicator |

---

### TASK 9 — AI Analyst: Connect to ML Context 🟡

**Priority:** Medium | **Time Est:** 45 min

**What's available:** LLM Gateway is scaffolded but API keys not yet configured. However, you can prepare the UI to consume LLM responses.

**Update AI Analyst page:**
1. Chat interface sends queries to `POST /llm/chat` (will return 501 until keys configured)
2. "Analyze Alert" button on alert detail sends to `POST /llm/analyze-alert/{id}`
3. Show ML context in the analysis panel (model scores, feature importance)

**For now:** Show a "Connecting to AI..." state with the ML scores context pre-loaded. When LLM keys are configured in Week 4, the AI responses will populate automatically.

**Verification:**
| Check | Expected |
|-------|----------|
| Chat interface renders | Input + message area |
| "Analyze" button exists on alerts | Visible in alert detail |
| ML context displayed | Model scores + feature data |
| Graceful error for 501 | "AI Analyst activating soon..." |

---

### TASK 10 — Cross-Page Navigation 🟡

**Priority:** Medium | **Time Est:** 20 min

**Wire up navigation between pages:**

- War Room → Click alert → navigates to `/alerts/{id}`
- War Room → Click top talker IP → navigates to `/network?ip={ip}`
- Alert detail → Click source IP → navigates to `/network?ip={ip}`
- Alert detail → "Analyze with AI" → navigates to `/ai-analyst?alert={id}`
- ML Operations → Click model → shows detail panel

**Use Next.js App Router navigation:**
```typescript
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push(`/alerts/${alertId}`);
```

**Verification:**
| Check | Expected |
|-------|----------|
| Alert click navigates | War Room → Alert Console |
| IP click navigates | War Room → Network Flow |
| "Analyze" navigates | Alert → AI Analyst |
| Back button works | Browser history correct |

---

## Design System Reference

**All components MUST use these design tokens:**

```css
/* Colors */
--bg-primary: #0a0a0f;
--bg-secondary: #111118;
--bg-glass: rgba(17, 17, 24, 0.7);
--cyan: #00f0ff;
--critical: #ef4444;
--warning: #f59e0b;
--safe: #22c55e;
--info: #3b82f6;

/* Typography */
--font-data: "JetBrains Mono", monospace;    /* metrics, scores, IPs */
--font-ui: "Inter", -apple-system, sans-serif; /* labels, descriptions */

/* GlassPanel */
background: var(--bg-glass);
backdrop-filter: blur(12px);
border: 1px solid rgba(0, 240, 255, 0.1);
border-radius: 12px;

/* Severity Colors */
.severity-critical { color: var(--critical); border-color: var(--critical); }
.severity-high     { color: var(--warning); border-color: var(--warning); }
.severity-medium   { color: #f59e0b; border-color: #f59e0b; }
.severity-low      { color: var(--info); border-color: var(--info); }
```

---

## Acceptance Criteria

Day 10-12 frontend tasks are complete when:

1. ✅ War Room MetricCards show real ML-scored anomaly data
2. ✅ LiveAlertFeed shows ML-generated alerts with severity + scores
3. ✅ ThreatLevel gauge reflects real ML alert distribution
4. ✅ Alert Console page fully implemented with table + detail drawer
5. ✅ ML Operations page shows 4 model cards with real metrics
6. ✅ Network Flow page renders flow table with anomaly badges
7. ✅ WebSocket handles `new_alert` and `anomaly_detected` events
8. ✅ Notification toasts appear for new alerts
9. ✅ Sidebar badges show real counts
10. ✅ Cross-page navigation works (alerts → network → AI analyst)
11. ✅ All components use GlassPanel + design system
12. ✅ No console errors
13. ✅ JetBrains Mono for data, Inter for UI text

---

## Reference Documents

| Document | Section | Purpose |
|----------|---------|---------|
| MASTER_DOC_PART3 | §1.2-1.5 | Design system, GlassPanel, layout |
| MASTER_DOC_PART3 | §2.2-2.3 | War Room layout + component specs |
| MASTER_DOC_PART3 | §4 | Network Flow module spec |
| MASTER_DOC_PART3 | §6 | Alert Console module spec |
| MASTER_DOC_PART3 | §8 | ML Operations module spec |
| MASTER_DOC_PART2 | §5.1 | API endpoint reference |
| MASTER_DOC_PART2 | §5.2 | WebSocket event contracts |
| SESSION_HANDOFF.md | Full | Current project context |
| ThreatMatrix_AI_Day10_Report.md | §5 | ML model performance data |

---

_Task document for Full-Stack Dev — Day 10-12 (Week 3-4)_
_Focus: ML-enriched War Room, Alert Console, ML Operations page, WebSocket ML events_
_Strict adherence to MASTER_DOC_PART3 design system and War Room aesthetic_
