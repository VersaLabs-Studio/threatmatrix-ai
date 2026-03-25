# ThreatMatrix AI — Frontend Tasks Day 14 (Full-Stack Dev)

> **Date:** 2026-03-26  
> **Sprint:** 4 (Intelligence Integration)  
> **Owner:** Full-Stack Dev  
> **Goal:** Connect frontend to live ML/LLM/IOC backends, implement missing components, catch up to current backend status  
> **Reference:** MASTER_DOC_PART3 §2-8, MASTER_DOC_PART5 §3 (Week 4 Frontend Tasks)

---

## 📋 What Changed Since Your Day 10 Tasks

Since the Day 10-12 frontend task document was issued, the **Lead Architect has completed major milestones** that unlock new frontend capabilities. Here's what's new:

### New Backend Capabilities (Days 11-13)

| Feature | Status | What It Means for Frontend |
|---------|--------|-----------------------------|
| **ML Worker live scoring** | ✅ Live | 24,700+ flows scored, `anomaly_score` on every flow |
| **LLM Gateway (3 models)** | ✅ Live | `POST /llm/chat` and `POST /llm/analyze-alert` return real AI responses |
| **LLM Auto-Narrative** | ✅ Live Day 13 | Every alert has `ai_narrative` column with AI-generated analyst reports |
| **IOC Correlator** | ✅ Live Day 13 | Flow IPs checked against threat intel, severity auto-escalation |
| **POST /ml/retrain** | ✅ Live Day 13 | Trigger model retraining via API |
| **GET /ml/retrain/{task_id}** | ✅ Live Day 13 | Check retrain status |
| **WebSocket ml:live** | ✅ Live Day 13 | `anomaly_detected` events broadcast from ML Worker |
| **Hyperparameter tuning** | ✅ Complete | IF F1 improved +4.28%, results in `best_params.json` |
| **Alert ML scores** | ✅ Live | `composite_score`, `if_score`, `rf_score`, `ae_score` on alerts |
| **4 anomalies detected** | ✅ Real data | 4 real-world probe attacks detected by ML |

### API Endpoints Now Available (37 total — up from 25)

```
AUTH:     POST /auth/login, /register, /refresh  |  GET /auth/me  |  POST /auth/logout
FLOWS:    GET /flows/, /flows/{id}, /flows/stats, /flows/top-talkers, /flows/protocols  |  POST /flows/search
ALERTS:   GET /alerts/, /alerts/{id}, /alerts/stats  |  PATCH /alerts/{id}/status, /alerts/{id}/assign
CAPTURE:  GET /capture/status, /capture/interfaces  |  POST /capture/start, /capture/stop
SYSTEM:   GET /system/health, /system/info
ML:       GET /ml/models, /ml/comparison  |  POST /ml/predict  |  POST /ml/retrain ← NEW Day 13
          GET /ml/retrain/{task_id} ← NEW Day 13
LLM:      POST /llm/chat, /llm/analyze-alert/{id}  |  GET /llm/budget, /llm/stream-chat ← ALL LIVE NOW
          POST /llm/translate
INTEL:    GET /intel/lookup/{ip}, /intel/feeds/status, /intel/iocs  |  POST /intel/sync
WS:       WS /ws/
```

### WebSocket Channels (ALL active)

| Channel | Event | Status |
|---------|-------|--------|
| `flows:live` | `new_flow` | ✅ Active |
| `alerts:live` | `new_alert` | ✅ Active |
| `alerts:live` | `alert_updated` | ✅ Active |
| `system:status` | `capture_status` | ✅ Active |
| `system:status` | `system_metrics` | ✅ Active |
| **`ml:live`** | **`anomaly_detected`** | ✅ **NEW Day 13** |

---

## VPS Connection

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://187.124.45.161:8000
NEXT_PUBLIC_WS_URL=ws://187.124.45.161:8000
```

DEV_MODE is enabled — no JWT required. Use `"dev-mode-bypass"` token for WebSocket connection.

---

## ⚠️ Status of Day 10 PR

Your Day 10-12 pull request included changes across 10+ frontend files. These changes are **deployed on VPS** (they were included in the Day 13 git pull) but **have NOT been manually verified yet**. Day 14 tasks assume those changes are working and build on top of them.

**If any Day 10 tasks are broken**, fix them as part of the relevant Day 14 task.

---

## Task Breakdown

### TASK 1 — WebSocket: Subscribe to ml:live Channel 🔴

**Priority:** Critical | **Time Est:** 30 min  
**Source:** MASTER_DOC_PART3 §2.3 (War Room) + Day 13 backend changes

**What's new:** The backend now publishes `anomaly_detected` events on the `ml:live` channel every time the ML Worker detects an anomaly (composite_score ≥ 0.30).

**Update `hooks/useWebSocket.ts` and/or `lib/websocket.ts`:**

```typescript
// After WebSocket connection, subscribe to ml:live
websocket.send(JSON.stringify({
  action: "subscribe",
  channels: ["flows:live", "alerts:live", "system:status", "ml:live"]  // Add ml:live
}));

// Handle anomaly_detected event in message handler:
case 'anomaly_detected':
  // ML anomaly event — should trigger visual alert + update metrics
  const anomaly = message.data;
  // anomaly.payload contains:
  // { flow_id, composite_score, severity, category, source_ip, dest_ip,
  //   if_score, rf_confidence, ae_score, timestamp }

  // 1. Update anomaly counter in War Room
  setAnomalyCount(prev => prev + 1);

  // 2. Highlight in flow table (if Network page open)
  setHighlightedFlows(prev => [...prev, anomaly.payload.flow_id]);

  // 3. Show notification toast for MEDIUM+ severity
  if (['medium', 'high', 'critical'].includes(anomaly.payload.severity)) {
    showNotification({
      type: anomaly.payload.severity,
      title: `ML Anomaly: ${anomaly.payload.category}`,
      message: `Score: ${(anomaly.payload.composite_score * 100).toFixed(0)}% — ${anomaly.payload.source_ip} → ${anomaly.payload.dest_ip}`,
    });
  }
  break;
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | WebSocket connects and subscribes to ml:live | "subscribed" confirmation includes "ml:live" |
| 2 | anomaly_detected events visible in browser console | Events appear |
| 3 | Notification toast on anomaly | Severity-colored, auto-dismiss |
| 4 | No console errors | Clean |

---

### TASK 2 — AI Analyst: Live LLM Integration 🔴

**Priority:** Critical | **Time Est:** 60 min  
**Source:** MASTER_DOC_PART3 §7 (AI Analyst Module)

**What's new:** The LLM Gateway is **fully live** with 3 OpenRouter models. Chat responses are real, streaming SSE works, and alert analysis generates AI narratives.

**Update `app/ai-analyst/page.tsx` and `components/ai-analyst/ChatInterface.tsx`:**

#### 2.1 Connect Chat to `POST /llm/chat`

```typescript
// API call for chat
const sendMessage = async (userMessage: string) => {
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsStreaming(true);

  try {
    const response = await fetch(`${API_URL}/api/v1/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
        task_type: 'chat',
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.content || data.error || 'No response',
      model: data.model,
      tokens: { in: data.tokens_in, out: data.tokens_out },
    }]);
  } catch (error) {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '[Connection error — retrying...]',
    }]);
  } finally {
    setIsStreaming(false);
  }
};
```

#### 2.2 Connect "Analyze Alert" Button

From the Alert Console (AlertDetailDrawer), add an "Analyze with AI" button that navigates to AI Analyst with the alert context:

```typescript
// In AlertDetailDrawer.tsx:
const handleAnalyze = () => {
  router.push(`/ai-analyst?alert_id=${alert.id}`);
};

// In AI Analyst page, read alert_id from URL params:
const searchParams = useSearchParams();
const alertId = searchParams.get('alert_id');

// If alertId present, fetch alert and display AI narrative
useEffect(() => {
  if (alertId) {
    fetch(`${API_URL}/api/v1/alerts/${alertId}`)
      .then(res => res.json())
      .then(alert => {
        if (alert.ai_narrative) {
          setMessages([{
            role: 'assistant',
            content: alert.ai_narrative,
            model: 'pre-generated',
          }]);
        }
      });
  }
}, [alertId]);
```

#### 2.3 Display LLM Budget Status

Add a budget widget using `GET /llm/budget`:

```typescript
// Fetch budget info
const budgetResponse = await fetch(`${API_URL}/api/v1/llm/budget`);
const budget = await budgetResponse.json();
// budget.models_available → array of model IDs
// budget.stats → { requests, tokens_in, tokens_out, errors }
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | Chat sends message → LLM responds | Real AI-generated response (not stub) |
| 2 | Response shows model name | e.g., "openai/gpt-oss-120b:free" |
| 3 | "Analyze with AI" from alert detail | Navigates to AI Analyst with pre-loaded narrative |
| 4 | Alert AI narrative displayed | Markdown-formatted analyst report |
| 5 | Budget widget shows stats | Requests count, token usage |
| 6 | Streaming typing effect | Text appears progressively (if using SSE) |

---

### TASK 3 — Alert Console: AI Narrative Panel 🔴

**Priority:** Critical | **Time Est:** 45 min  
**Source:** MASTER_DOC_PART3 §6 (Alert Console)

**What's new:** Every alert now has an `ai_narrative` field containing a full AI-generated analyst report (markdown-formatted, with headers, bullet points, and recommendations).

**Update `AlertDetailDrawer.tsx`:**

```typescript
// Alert now contains ai_narrative field
interface Alert {
  id: string;
  alert_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  source_ip: string;
  dest_ip: string;
  confidence: number;
  status: string;
  composite_score: number;  // NEW
  if_score: number;         // NEW
  rf_score: number;         // NEW
  ae_score: number;         // NEW
  ai_narrative: string;     // NEW — AI-generated analyst report
  created_at: string;
}

// In the drawer, add an "AI Analysis" section:
{alert.ai_narrative && (
  <div className="ai-narrative-panel">
    <h3>🤖 AI Analyst Report</h3>
    <div className="narrative-content">
      {/* Render markdown — use react-markdown or dangerouslySetInnerHTML with sanitizer */}
      <ReactMarkdown>{alert.ai_narrative}</ReactMarkdown>
    </div>
  </div>
)}
```

**Style the AI narrative panel:**

```css
.ai-narrative-panel {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 240, 255, 0.03);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 8px;
}

.ai-narrative-panel h3 {
  color: var(--cyan);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.narrative-content {
  font-family: var(--font-ui);
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.narrative-content h1, .narrative-content h2, .narrative-content h3 {
  color: var(--cyan);
  margin-top: 0.75rem;
}
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | Alert detail shows AI narrative | Formatted analyst report visible |
| 2 | Markdown renders correctly | Headers, bullets, bold text |
| 3 | ML scores displayed | Composite, IF, RF, AE scores |
| 4 | "Analyze with AI" button works | Navigates to /ai-analyst?alert_id=... |
| 5 | Alerts without narrative show fallback | "Analysis pending..." or loading state |

---

### TASK 4 — ML Operations: Retrain Button + Tuning Results 🟡

**Priority:** Medium | **Time Est:** 45 min  
**Source:** MASTER_DOC_PART3 §8 (ML Operations)

**What's new:**
- `POST /ml/retrain` is live — triggers background model retraining
- `GET /ml/retrain/{task_id}` shows retrain status
- Hyperparameter tuning completed — IF improved +4.28% F1

**Update `app/ml-ops/page.tsx`:**

#### 4.1 Add Retrain Button

```typescript
const [retraining, setRetraining] = useState(false);
const [taskId, setTaskId] = useState<string | null>(null);

const triggerRetrain = async () => {
  setRetraining(true);
  try {
    const res = await fetch(`${API_URL}/api/v1/ml/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset: 'nsl_kdd',
        models: ['isolation_forest', 'random_forest', 'autoencoder'],
      }),
    });
    const data = await res.json();
    setTaskId(data.task_id);
    showNotification({ type: 'info', title: 'Retrain Started', message: `Task: ${data.task_id}` });
  } catch (error) {
    showNotification({ type: 'error', title: 'Retrain Failed', message: String(error) });
  } finally {
    setRetraining(false);
  }
};

// Render:
<button
  className="retrain-btn"
  onClick={triggerRetrain}
  disabled={retraining}
>
  {retraining ? 'Retraining...' : '🔄 Retrain Models'}
</button>
```

#### 4.2 Add Tuning Results Panel

Show the improvement from hyperparameter tuning:

```typescript
// Display tuning comparison
const tuningResults = {
  isolation_forest: {
    current: { accuracy: 79.68, f1: 78.75, auc: 93.78 },
    tuned:   { accuracy: 82.54, f1: 83.03 },
    improvement: '+4.28% F1',
  },
  random_forest: {
    current: { accuracy: 74.16, f1: 69.45, auc: 95.76 },
    tuned:   { accuracy: 74.70, f1: 70.08 },
    improvement: '+0.63% F1',
  },
};
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | Retrain button visible | Styled with design system |
| 2 | Click retrain → API called | 200 response with task_id |
| 3 | Notification shows task_id | "Retrain Started: xxxxxxxx" |
| 4 | Tuning results panel | Shows current vs tuned metrics |
| 5 | Ensemble highlighted | "🏆 Best: Ensemble (80.73% acc)" |

---

### TASK 5 — Intel Hub: Live Threat Intel Page 🟡

**Priority:** Medium | **Time Est:** 60 min  
**Source:** MASTER_DOC_PART3 §5 (Intel Hub)

**What's new:** All intel endpoints are live and will return real data once API keys are configured (Day 14 backend).

**Implement `app/intel/page.tsx`:**

#### 5.1 IP/Domain Lookup Widget

```typescript
const [lookupQuery, setLookupQuery] = useState('');
const [lookupResult, setLookupResult] = useState(null);

const performLookup = async () => {
  const res = await fetch(`${API_URL}/api/v1/intel/lookup/${lookupQuery}`);
  const data = await res.json();
  setLookupResult(data);
};

// Render: Input + Button + Results card showing:
// - OTX pulse count, reputation, country
// - AbuseIPDB abuse confidence, total reports, ISP
// - Combined threat score with color-coded badge
```

#### 5.2 IOC Browser

```typescript
// Fetch IOCs from database
const { data: iocs } = useSWR(`${API_URL}/api/v1/intel/iocs?limit=50`);

// Render table with columns:
// Type | Value | Threat Type | Severity | Source | Confidence | Last Seen
```

#### 5.3 Feed Status Panel

```typescript
// GET /intel/feeds/status
// Shows: OTX (enabled/disabled), AbuseIPDB (enabled/disabled), VirusTotal (enabled/disabled)
```

#### 5.4 Sync Button

```typescript
const syncFeeds = async () => {
  const res = await fetch(`${API_URL}/api/v1/intel/sync`, { method: 'POST' });
  const data = await res.json();
  // data.synced_pulses, data.iocs_inserted
};
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | IP lookup widget renders | Input + search button |
| 2 | Lookup returns data | OTX + AbuseIPDB combined results |
| 3 | IOC browser shows table | IOCs from database (may be empty initially) |
| 4 | Feed status displays | Shows enabled/disabled per provider |
| 5 | Sync button triggers OTX pull | "Synced N pulses" notification |

---

### TASK 6 — War Room: Enhanced Metric Cards 🟡

**Priority:** Medium | **Time Est:** 30 min  
**Source:** MASTER_DOC_PART3 §2.2

**What's new:** ML scoring data is live, anomaly counts are real, and LLM is generating narratives.

**Update War Room MetricCards to display:**

| Card | Source | Data |
|------|--------|------|
| FLOWS/MIN | `GET /flows/stats` | Real flow throughput |
| ANOMALY RATE | `GET /flows/stats` → anomaly_count / total | Real ML anomaly percentage |
| **ACTIVE THREATS** | `GET /alerts/stats` → critical + high | Count of open HIGH+ alerts |
| **ML MODELS** | `GET /ml/models` → trained count | "3/3 Ensemble Active" |
| **AI STATUS** | `GET /llm/budget` → requests count | "AI Active: N analyses" |

**Add AIBriefingWidget connection:**

```typescript
// The AIBriefingWidget can now call POST /llm/chat with daily_briefing task_type
const generateBriefing = async () => {
  const alertStats = await fetch(`${API_URL}/api/v1/alerts/stats`).then(r => r.json());
  const res = await fetch(`${API_URL}/api/v1/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: `Generate a threat briefing. Stats: ${JSON.stringify(alertStats)}` }],
      task_type: 'daily_briefing',
    }),
  });
  const data = await res.json();
  setBriefing(data.content);
};
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | ANOMALY RATE shows real % | Non-zero if anomalies exist |
| 2 | ACTIVE THREATS shows real count | Matches database |
| 3 | ML MODELS shows "3/3" | All trained |
| 4 | AIBriefingWidget loads briefing | AI-generated text appears |

---

### TASK 7 — Network Flow: Anomaly Score Column + Highlighting 🟡

**Priority:** Medium | **Time Est:** 30 min  
**Source:** MASTER_DOC_PART3 §4 (Network Flow)

**What's new:** Every flow now has `anomaly_score` (0.0-1.0) and `is_anomaly` (boolean) from ML scoring.

**Update `app/network/page.tsx`:**

```typescript
// Flow table now includes anomaly columns:
{
  id: 'anomaly_score',
  header: 'ML Score',
  cell: ({ row }) => {
    const score = row.original.anomaly_score;
    const color = score >= 0.75 ? 'var(--critical)' :
                  score >= 0.50 ? 'var(--warning)' :
                  score >= 0.30 ? '#f59e0b' :
                  'var(--safe)';
    return (
      <span style={{ color, fontFamily: 'var(--font-data)' }}>
        {score ? `${(score * 100).toFixed(0)}%` : '—'}
      </span>
    );
  },
},
{
  id: 'is_anomaly',
  header: 'Status',
  cell: ({ row }) => (
    <StatusBadge
      type={row.original.is_anomaly ? 'anomaly' : 'normal'}
      label={row.original.is_anomaly ? 'ANOMALY' : 'Normal'}
    />
  ),
},
```

**Highlight anomalous rows:**

```css
.flow-row-anomaly {
  background: rgba(239, 68, 68, 0.05);
  border-left: 3px solid var(--critical);
}
```

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | Anomaly Score column visible | ML scores shown |
| 2 | Status badge shows Anomaly/Normal | Color-coded |
| 3 | Anomalous rows highlighted | Red left border |
| 4 | Score color gradient | Green→Yellow→Red |

---

### TASK 8 — Cross-Page Navigation Wiring 🟡

**Priority:** Medium | **Time Est:** 20 min  
**Source:** Day 10 Task 10 (verify and complete)

Confirm all navigation links work:

| From | Action | To | Method |
|------|--------|------|--------|
| War Room → LiveAlertFeed | Click alert | `/alerts?id={alertId}` | router.push |
| War Room → TopTalkers | Click IP | `/network?ip={ip}` | router.push |
| Alert Detail → Source IP | Click IP | `/network?ip={ip}` | router.push |
| Alert Detail → "Analyze with AI" | Click button | `/ai-analyst?alert_id={id}` | router.push |
| ML Ops → Retrain | Click retrain | Stays on page, shows progress | API call |
| Intel Hub → IP Lookup | Click IP in table | Calls lookup API | In-page |

**Verification:**
| # | Check | Expected |
|---|-------|----------|
| 1 | Alert click → Alert page | Shows alert detail |
| 2 | IP click → Network page | Filters to that IP |
| 3 | "Analyze with AI" → AI Analyst | Shows pre-loaded narrative |
| 4 | Back button | Browser history works |

---

## Design System Reference (Unchanged)

```css
/* Colors — DO NOT use Tailwind */
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

/* GlassPanel — use for ALL cards/panels */
background: var(--bg-glass);
backdrop-filter: blur(12px);
border: 1px solid rgba(0, 240, 255, 0.1);
border-radius: 12px;
```

---

## Acceptance Criteria

Day 14 frontend tasks are complete when:

1. ✅ WebSocket subscribes to `ml:live` + handles `anomaly_detected` events
2. ✅ AI Analyst chat sends messages → receives real LLM responses
3. ✅ Alert detail shows AI narrative (markdown rendered)
4. ✅ ML Ops page has Retrain button (calls `POST /ml/retrain`)
5. ✅ Intel Hub has IP lookup + IOC browser + feed status
6. ✅ War Room MetricCards show real ML-scored data
7. ✅ Network Flow page shows anomaly score + highlighting
8. ✅ Cross-page navigation works (alerts → network → AI analyst)
9. ✅ All components use GlassPanel + design system
10. ✅ No console errors
11. ✅ JetBrains Mono for data, Inter for UI text
12. ✅ No Tailwind CSS — Vanilla CSS + CSS Variables only

---

## Reference Documents

| Document | Section | Purpose |
|----------|---------|---------| 
| MASTER_DOC_PART3 | §2.2-2.3 | War Room layout + widget specs |
| MASTER_DOC_PART3 | §4 | Network Flow module spec |
| MASTER_DOC_PART3 | §5 | Intel Hub module spec |
| MASTER_DOC_PART3 | §6 | Alert Console module spec |
| MASTER_DOC_PART3 | §7 | AI Analyst module spec |
| MASTER_DOC_PART3 | §8 | ML Operations module spec |
| MASTER_DOC_PART2 | §5.1 | API endpoint reference (37 endpoints) |
| MASTER_DOC_PART2 | §5.2 | WebSocket event contracts |
| SESSION_HANDOFF.md | Full | Current project context |
| DAY_13_VPS_VERIFICATION_REPORT.md | Full | What changed in Day 13 |
| FRONTEND_TASKS_DAY10.md | Full | Previous task document (verify completion) |

---

**⚠️ STRICT RULES:**
- **DO NOT** use Tailwind CSS — Vanilla CSS + CSS Variables only
- **DO NOT** add UI for features outside the 10 modules
- **DO NOT** change API response schemas — consume what the backend provides
- All components **MUST** use GlassPanel for containers
- All data text **MUST** use JetBrains Mono
- All label text **MUST** use Inter
- Severity colors: Critical=#ef4444, High=#f59e0b, Medium=#f59e0b, Low=#3b82f6

---

_Frontend Task Document — Day 14 (Week 4 Day 1)_  
_Focus: Live LLM integration, WebSocket ml:live, Alert AI narratives, Intel Hub, ML Ops retrain_  
_Backend status: 37/42 API endpoints live, 3 LLM models active, 24,700+ flows scored_  
_Strict adherence to MASTER_DOC_PART3 design system and War Room aesthetic_
