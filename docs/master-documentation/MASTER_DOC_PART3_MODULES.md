# ThreatMatrix AI — Master Documentation v1.0

## Part 3: Module Specifications & UI/UX Design System

> **Part:** 3 of 5 | **Version:** 1.0.0 | **Date:** 2026-02-23  
> **Prev:** [Part 2 — Architecture](./MASTER_DOC_PART2_ARCHITECTURE.md) | **Next:** [Part 4 — ML & LLM](./MASTER_DOC_PART4_ML_LLM.md)

---

## Table of Contents — Part 3

1. [UI/UX Design System](#1-uiux-design-system)
2. [War Room Module](#2-war-room-module)
3. [Threat Hunt Module](#3-threat-hunt-module)
4. [Intel Hub Module](#4-intel-hub-module)
5. [Network Flow Module](#5-network-flow-module)
6. [AI Analyst Module](#6-ai-analyst-module)
7. [Alert Console Module](#7-alert-console-module)
8. [Forensics Lab Module](#8-forensics-lab-module)
9. [ML Operations Module](#9-ml-operations-module)
10. [Reports Module](#10-reports-module)
11. [Administration Module](#11-administration-module)

---

## 1. UI/UX Design System

### 1.1 Design Philosophy: Intelligence Agency Operations Center

Every pixel must reinforce the feeling of being inside a **cyber operations center**. The user should feel like they are commanding a defense system, not browsing a dashboard.

### 1.2 Color System

```css
:root {
  /* Core Palette */
  --bg-primary: #0a0a0f; /* Deep black - operations center base */
  --bg-secondary: #111118; /* Slightly lighter panels */
  --bg-tertiary: #1a1a24; /* Card backgrounds */
  --bg-elevated: #222230; /* Elevated panels, modals */

  /* Accent Colors */
  --cyan: #00f0ff; /* Primary - cyber intelligence */
  --cyan-dim: #00f0ff33; /* Cyan with transparency */
  --cyan-glow: 0 0 20px #00f0ff44, 0 0 40px #00f0ff22;

  /* Status Colors */
  --critical: #ef4444; /* Critical severity */
  --critical-glow: 0 0 15px #ef444444;
  --high: #f97316; /* High severity (orange) */
  --warning: #f59e0b; /* Warning / medium severity */
  --safe: #22c55e; /* Safe / resolved / normal */
  --info: #3b82f6; /* Informational */

  /* Text */
  --text-primary: #e2e8f0; /* Primary text */
  --text-secondary: #94a3b8; /* Secondary/dimmed text */
  --text-muted: #475569; /* Muted labels */

  /* Borders & Surfaces */
  --border: #ffffff10; /* Subtle borders */
  --border-active: #00f0ff30; /* Active/focused borders */
  --glass: rgba(255, 255, 255, 0.03); /* Glassmorphism fill */
  --glass-border: rgba(255, 255, 255, 0.06);

  /* Gradients */
  --gradient-threat: linear-gradient(135deg, #ef4444, #f97316);
  --gradient-safe: linear-gradient(135deg, #22c55e, #06b6d4);
  --gradient-cyber: linear-gradient(135deg, #00f0ff, #3b82f6);
}
```

### 1.3 Typography

```css
/* Data/Metrics - Monospace */
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap");

/* UI Labels - Sans-serif */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

:root {
  --font-data: "JetBrains Mono", monospace;
  --font-ui: "Inter", -apple-system, sans-serif;

  --text-xs: 0.75rem; /* 12px - Ticker text, labels */
  --text-sm: 0.875rem; /* 14px - Secondary info */
  --text-base: 1rem; /* 16px - Body text */
  --text-lg: 1.125rem; /* 18px - Subheadings */
  --text-xl: 1.25rem; /* 20px - Section titles */
  --text-2xl: 1.5rem; /* 24px - Page titles */
  --text-3xl: 2rem; /* 32px - Hero metrics */
  --text-4xl: 2.5rem; /* 40px - War Room main stats */
}
```

### 1.4 Component Patterns

#### Glass Panel (Primary Container)

```css
.glass-panel {
  background: var(--glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1.5rem;
}
```

#### Threat Level Indicator

```css
.threat-gauge {
  /* DEFCON-style: SAFE → GUARDED → ELEVATED → HIGH → CRITICAL */
  background: conic-gradient(
    var(--safe) 0deg,
    var(--warning) 120deg,
    var(--high) 200deg,
    var(--critical) 280deg,
    var(--critical) 360deg
  );
  border-radius: 50%;
  position: relative;
}
```

#### Scan Line Animation

```css
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100vh);
  }
}

.scanline-overlay::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan-dim), transparent);
  animation: scanline 8s linear infinite;
  opacity: 0.15;
}
```

#### Pulsing Alert Card

```css
@keyframes pulse-critical {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.alert-card--critical {
  border-left: 3px solid var(--critical);
  animation: pulse-critical 2s ease-in-out infinite;
}
```

### 1.5 Layout System

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR (56px) — Logo, Threat Level Badge, Notifications, User     │
├────────┬─────────────────────────────────────────────────────────────┤
│        │                                                             │
│ SIDE   │              MAIN CONTENT AREA                              │
│ NAV    │              (calc(100vh - 56px - 32px))                    │
│ (64px) │                                                             │
│        │              Scrollable                                     │
│ Icons  │              Grid-based layout per module                   │
│ only   │                                                             │
│        │                                                             │
│ Tooltip│                                                             │
│ on     │                                                             │
│ hover  │                                                             │
│        │                                                             │
├────────┴─────────────────────────────────────────────────────────────┤
│ STATUS BAR (32px) — Capture Status, ML Engine, Feeds, Time (UTC)   │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.6 Navigation Structure

| Icon | Module         | Route         | Keyboard |
| ---- | -------------- | ------------- | -------- |
| 🎯   | War Room       | `/war-room`   | `Alt+1`  |
| 🔍   | Threat Hunt    | `/hunt`       | `Alt+2`  |
| 🛡️   | Intel Hub      | `/intel`      | `Alt+3`  |
| 📡   | Network Flow   | `/network`    | `Alt+4`  |
| 🤖   | AI Analyst     | `/ai-analyst` | `Alt+5`  |
| 🚨   | Alert Console  | `/alerts`     | `Alt+6`  |
| 🔬   | Forensics Lab  | `/forensics`  | `Alt+7`  |
| 🧠   | ML Operations  | `/ml-ops`     | `Alt+8`  |
| 📊   | Reports        | `/reports`    | `Alt+9`  |
| ⚙️   | Administration | `/admin`      | `Alt+0`  |

---

## 2. War Room Module

**Route:** `/war-room` | **Priority:** 🔴 P0 (Crown Jewel) | **Owner:** Full-Stack Dev + Lead Architect

### 2.1 Purpose

The primary operational view. This is the first page any user sees and the centerpiece of every demo. It must make jaws drop.

### 2.2 Layout Grid

```
┌──────────────────────────────────────────────────────────────────────┐
│  THREAT LEVEL: ████ ELEVATED          [🔴 3 Critical] [Auto-refresh]│
├───────────────────────────────────┬──────────────────────────────────┤
│                                   │  LIVE METRICS (4 cards)          │
│    MAIN THEATER:                  │  ┌────────┐ ┌────────┐          │
│    LIVE THREAT MAP               │  │Pkts/s  │ │Flows   │          │
│                                   │  │12,847  │ │342     │          │
│    Deck.gl ScatterplotLayer       │  └────────┘ └────────┘          │
│    + ArcLayer for attack flows    │  ┌────────┐ ┌────────┐          │
│    + HeatmapLayer for hotspots    │  │Anomaly%│ │Threats │          │
│                                   │  │3.2%    │ │48 (24h)│          │
│    Dark Maplibre basemap          │  └────────┘ └────────┘          │
│    Auto-center on activity        │                                  │
│                                   │  PROTOCOL DISTRIBUTION           │
│                                   │  (Animated donut chart)          │
│                                   │  TCP ████████ 62%                │
│                                   │  UDP ████    24%                 │
│                                   │  ICMP ██     8%                  │
├───────────────────────────────────┤  Other █     6%                  │
│  LIVE ALERT FEED (scrolling)      ├──────────────────────────────────┤
│  🔴 22:14:03 DDoS detected...    │  TRAFFIC TIMELINE (area chart)   │
│  🟡 22:13:58 Suspicious DNS...   │  Glowing cyan area               │
│  🟡 22:13:42 Port scan from...   │  Anomaly spikes in red overlay   │
│  🟢 22:13:30 Baseline restored   │  Last 60 minutes, auto-scroll    │
├───────────────────────────────────┴──────────────────────────────────┤
│  AI BRIEFING: "In the last hour, your network processed 46K flows.  │
│  3 anomalous patterns detected..."  [View Full Briefing →]          │
├──────────────────────────────────────────────────────────────────────┤
│  TOP THREATS     │  TOP TALKERS (IPs)    │  GEO DISTRIBUTION         │
│  1. DDoS (94%)   │  10.0.1.5    42%      │  🇪🇹 Ethiopia   65%       │
│  2. Scan (87%)   │  10.0.1.12   28%      │  🇨🇳 China      18%       │
│  3. DNS (72%)    │  10.0.1.8    18%      │  🇺🇸 USA         9%       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Components Specification

| Component                 | Data Source                | Update Frequency      | Technology                   |
| ------------------------- | -------------------------- | --------------------- | ---------------------------- |
| **Threat Level Gauge**    | Alert severity aggregation | 5 seconds             | SVG gauge with CSS animation |
| **Live Threat Map**       | Flow geo-IP data           | Real-time (WebSocket) | Deck.gl + Maplibre           |
| **Metric Cards**          | Flow/alert aggregation API | 3 seconds             | Recharts SparkLine           |
| **Live Alert Feed**       | WebSocket `alerts:live`    | Real-time             | Virtual scrolling list       |
| **Protocol Distribution** | `/flows/protocols`         | 10 seconds            | Recharts PieChart            |
| **Traffic Timeline**      | `/flows/stats?interval=1m` | 5 seconds             | Recharts AreaChart           |
| **AI Briefing Widget**    | `/llm/briefing` (cached)   | 5 minutes             | Typing effect animation      |
| **Top Threats**           | `/alerts/stats`            | 10 seconds            | Ranked list with bars        |
| **Top Talkers**           | `/flows/top-talkers`       | 10 seconds            | Horizontal bar chart         |
| **Geo Distribution**      | Flow geo-IP aggregation    | 30 seconds            | Flag list with percentages   |

### 2.4 Map Layers (Deck.gl)

| Layer                | Purpose                            | Visual                                 |
| -------------------- | ---------------------------------- | -------------------------------------- |
| **ScatterplotLayer** | Plot source/destination IPs on map | Cyan dots (normal), Red dots (anomaly) |
| **ArcLayer**         | Show connection paths between IPs  | Glowing arcs, color-coded by severity  |
| **HeatmapLayer**     | Show geographic concentration      | Heat gradient overlay                  |
| **IconLayer**        | Mark known threat actor locations  | Skull icons for known bad IPs          |

---

## 3. Threat Hunt Module

**Route:** `/hunt` | **Priority:** 🔴 P0 | **Owner:** Lead Architect

### 3.1 Purpose

Proactive threat investigation tool. Analysts can build queries, filter by IOC/IP/protocol/timeframe, and drill into suspicious patterns.

### 3.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  THREAT HUNT                              [Save Query] [History ▾]  │
├──────────────────────────────────────────────────────────────────────┤
│  QUERY BUILDER                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Source IP [_________] Dest IP [_________] Protocol [▾ Any]    │  │
│  │ Port Range [___-___] Time Range [Last 1h ▾] Severity [▾ Any]  │  │
│  │ Min Score [0.5____] Label [▾ Any]  [🔍 Hunt]  [Reset]        │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  RESULTS (2,847 flows matching)        [Export CSV] [Analyze w/ AI] │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ Time       │ Src IP      │ Dst IP      │ Proto│ Score │ Label  ││
│  │ 22:14:03  │ 10.0.1.5    │ 8.8.8.8     │ UDP  │ 0.94  │ DDoS   ││
│  │ 22:13:58  │ 10.0.1.5    │ evil.com    │ TCP  │ 0.87  │ C2     ││
│  │ 22:13:42  │ 192.168.1.1 │ 10.0.1.100  │ TCP  │ 0.72  │ Scan   ││
│  └──────────────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────────────┤
│  FLOW DETAIL (selected)                                              │
│  Full feature vector │ Related alerts │ Intel matches │ Timeline    │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Key Features

| Feature                | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| **Query Builder**      | Visual filter builder with AND/OR logic, saved queries               |
| **Results Table**      | Sortable, paginated, with inline sparklines for traffic patterns     |
| **Flow Detail Drawer** | Side panel showing all 40+ features, related alerts, IOC matches     |
| **AI Analysis Button** | Send selected flows to AI Analyst for natural language analysis      |
| **Export**             | CSV/JSON export for offline analysis                                 |
| **Hunt History**       | Saved previous queries with timestamps                               |
| **Quick Filters**      | Pre-built: "Unusual DNS", "Port Scans", "High Volume", "Foreign IPs" |

---

## 4. Intel Hub Module

**Route:** `/intel` | **Priority:** 🔴 P0 | **Owner:** Lead Architect

### 4.1 Purpose

Threat intelligence aggregation and IOC (Indicators of Compromise) management. Correlates external intelligence with internal network observations.

### 4.2 Components

| Component                 | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| **IOC Browser**           | Searchable/filterable table of all IOCs from feeds (IP, domain, hash)           |
| **IP Reputation Lookup**  | Enter any IP → get reputation score, associated threats, feed sources           |
| **Feed Status Dashboard** | Health of each feed (OTX, AbuseIPDB, VirusTotal), last sync, IOC count          |
| **Correlation Panel**     | IOCs matched to internal network flows — "These IOCs were seen in your traffic" |
| **Threat Actor Profiles** | Known threat groups associated with detected IOCs                               |
| **Manual IOC Entry**      | Add custom IOCs (e.g., from incident response)                                  |

### 4.3 Feed Integration Details

| Feed               | API  | Free Tier            | Data Retrieved                                  |
| ------------------ | ---- | -------------------- | ----------------------------------------------- |
| **AlienVault OTX** | REST | Unlimited (with key) | Pulses, IP/domain/URL IOCs, threat descriptions |
| **AbuseIPDB**      | REST | 1,000 checks/day     | IP reputation, abuse reports, categories        |
| **VirusTotal**     | REST | 500 requests/day     | IP/domain/file analysis, detection ratios       |

---

## 5. Network Flow Module

**Route:** `/network` | **Priority:** 🔴 P0 | **Owner:** Full-Stack Dev

### 5.1 Components

| Component                   | Description                                  | Chart Type                 |
| --------------------------- | -------------------------------------------- | -------------------------- |
| **Traffic Volume Timeline** | Packets/bytes over time with anomaly overlay | Area chart (Recharts)      |
| **Top Talkers**             | Top source/destination IPs by traffic volume | Horizontal bar chart       |
| **Protocol Distribution**   | Breakdown by protocol (TCP/UDP/ICMP/Other)   | Pie/donut chart            |
| **Port Activity**           | Most active destination ports                | Treemap                    |
| **Connection Graph**        | Force-directed graph of IP connections       | D3 force layout or Deck.gl |
| **Bandwidth Monitor**       | Real-time throughput (Mbps in/out)           | Dual area chart            |
| **Geo Traffic Map**         | Traffic distribution by country              | Choropleth map             |
| **Flow Table**              | Live-updating sortable table of recent flows | Virtual scrolling table    |

---

## 6. AI Analyst Module

**Route:** `/ai-analyst` | **Priority:** 🔴 P0 | **Owner:** Lead Architect

### 6.1 Purpose

The **innovation differentiator**. A conversational AI interface that lets analysts investigate threats using natural language. No other cybersecurity senior project has this.

### 6.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  🤖 AI ANALYST           [Context: General ▾]  [Token Budget: 82%] │
├──────────────────────────────────┬───────────────────────────────────┤
│                                  │  QUICK ACTIONS                    │
│  CONVERSATION                    │  ┌─────────────────────────────┐ │
│                                  │  │ 📋 Daily Threat Briefing    │ │
│  ┌────────────────────────────┐  │  │ 🔍 Analyze Latest Alert     │ │
│  │ 🤖 AI: Based on analysis  │  │  │ 📊 Network Health Summary   │ │
│  │ of the last 2 hours, I've │  │  │ 🇪🇹 Translate Last Report   │ │
│  │ identified 3 anomalous    │  │  │ 🎯 Top Risks Assessment     │ │
│  │ patterns in your traffic: │  │  │ 📝 Generate Exec Summary    │ │
│  │                            │  │  └─────────────────────────────┘ │
│  │ 1. DNS tunneling suspect  │  │                                   │
│  │    from 10.0.1.23 (conf:  │  │  CONTEXT PANEL                   │
│  │    87%)                    │  │  Shows data AI is referencing:   │
│  │ 2. Port scan activity...  │  │  • Related flows                 │
│  │                            │  │  • Alert details                 │
│  │ 👤 You: What about the    │  │  • IOC matches                   │
│  │ DNS traffic specifically? │  │  • Model predictions             │
│  │                            │  │                                   │
│  │ 🤖 AI: The DNS queries    │  │  CONFIDENCE INDICATOR            │
│  │ from 10.0.1.23 show...    │  │  ████████░░ 82%                  │
│  │ [typing effect animation] │  │  "High confidence analysis"      │
│  └────────────────────────────┘  │                                   │
│                                  │                                   │
│  ┌────────────────────────────┐  │                                   │
│  │ Ask about threats...  [→] │  │                                   │
│  └────────────────────────────┘  │                                   │
└──────────────────────────────────┴───────────────────────────────────┘
```

### 6.3 LLM Query Types

| Query Type            | Example Prompt                        | Backend Action                                     |
| --------------------- | ------------------------------------- | -------------------------------------------------- |
| **Alert Analysis**    | "Explain alert TM-ALERT-00042"        | Fetch alert + flows, send to LLM with context      |
| **Threat Hunt**       | "Show me suspicious DNS activity"     | Query flows DB, summarize with LLM                 |
| **Network Summary**   | "How is my network doing?"            | Aggregate metrics, LLM generates narrative         |
| **IP Investigation**  | "Is 45.33.32.156 dangerous?"          | Check intel feeds + internal flows, LLM correlates |
| **Report Generation** | "Generate a daily briefing"           | Aggregate 24h data, LLM writes report              |
| **Translation**       | "Translate the last alert to Amharic" | Fetch alert text, send to LLM for translation      |
| **Playbook**          | "How do I respond to this DDoS?"      | LLM generates incident response steps              |

### 6.4 Streaming Response

LLM responses stream token-by-token via WebSocket + Server-Sent Events for a typing effect that makes the AI feel alive and responsive.

---

## 7. Alert Console Module

**Route:** `/alerts` | **Priority:** 🟡 P1 | **Owner:** Full-Stack Dev

### 7.1 Alert Lifecycle

```
New Alert → OPEN → ACKNOWLEDGED → INVESTIGATING → RESOLVED
                                                  → FALSE POSITIVE
```

### 7.2 Components

| Component                | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| **Alert Table**          | Sortable by severity/time/status, with search and filters |
| **Alert Detail Drawer**  | Full alert info, AI narrative, related flows, timeline    |
| **Severity Filter Tabs** | Critical / High / Medium / Low / Info / All               |
| **Status Filter**        | Open / Acknowledged / Investigating / Resolved            |
| **Bulk Actions**         | Acknowledge multiple, assign to analyst                   |
| **Alert Timeline**       | Chronological view of alert activity                      |
| **Statistics Panel**     | Alert counts by severity, MTTR, trends                    |

### 7.3 Severity Definitions

| Level        | Color     | Trigger                                                 | Response Time SLA     |
| ------------ | --------- | ------------------------------------------------------- | --------------------- |
| **Critical** | `#ef4444` | Active attack detected (DDoS, C2), confidence ≥90%      | Immediate             |
| **High**     | `#f97316` | Likely attack (port scan, brute force), confidence ≥75% | 15 minutes            |
| **Medium**   | `#f59e0b` | Suspicious activity, confidence ≥50%                    | 1 hour                |
| **Low**      | `#3b82f6` | Unusual but potentially benign pattern                  | 4 hours               |
| **Info**     | `#94a3b8` | Informational observation                               | Review at convenience |

---

## 8. Forensics Lab Module

**Route:** `/forensics` | **Priority:** 🟡 P1 | **Owner:** Lead Architect

### 8.1 Components

| Component               | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **PCAP Upload**         | Drag-and-drop .pcap/.pcapng file upload with progress        |
| **Analysis Results**    | Summary: packet count, flow count, anomalies found, timeline |
| **Packet Inspector**    | Table of extracted packets with protocol breakdown           |
| **Flow Reconstruction** | Reconstructed TCP sessions for suspicious connections        |
| **Timeline View**       | Chronological event timeline from PCAP data                  |
| **AI Analysis**         | Send PCAP results to AI Analyst for narrative                |
| **Upload History**      | Previous uploads with status and results                     |

---

## 9. ML Operations Module

**Route:** `/ml-ops` | **Priority:** 🟡 P1 | **Owner:** Lead Architect

### 9.1 Components

| Component                  | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| **Model Registry**         | Table of all trained models with status (active/retired)      |
| **Performance Dashboard**  | Accuracy, precision, recall, F1 per model                     |
| **Confusion Matrix**       | Interactive heatmap for each model's classification matrix    |
| **ROC Curves**             | Overlay ROC curves for model comparison (academic money shot) |
| **Feature Importance**     | Ranked bar chart of most important features per model         |
| **Model Comparison Table** | Side-by-side metrics: 3 models × N metrics                    |
| **Inference Monitor**      | Real-time inference throughput and latency                    |
| **Retraining Controls**    | Trigger retraining with dataset/hyperparameter selection      |
| **Training History**       | Log of all training runs with metrics over time               |

### 9.2 The Academic Money Shot: Model Comparison

```
┌──────────────────────────────────────────────────────────────────────┐
│  MODEL COMPARISON                                                    │
├──────────────┬────────────────┬────────────────┬─────────────────────┤
│ Metric       │ Isolation      │ Random Forest  │ Autoencoder         │
│              │ Forest         │                │                     │
├──────────────┼────────────────┼────────────────┼─────────────────────┤
│ Accuracy     │ 92.3%          │ 97.1%          │ 94.8%               │
│ Precision    │ 89.7%          │ 96.5%          │ 93.2%               │
│ Recall       │ 91.1%          │ 97.8%          │ 95.1%               │
│ F1-Score     │ 90.4%          │ 97.1%          │ 94.1%               │
│ AUC-ROC      │ 0.945          │ 0.991          │ 0.968               │
│ Train Time   │ 2.3s           │ 8.7s           │ 45.2s               │
│ Inference/ms │ 0.8ms          │ 1.2ms          │ 3.5ms               │
│ Type         │ Unsupervised   │ Supervised     │ Deep Learning       │
│ Zero-Day     │ ✅ Yes          │ ❌ No           │ ✅ Yes               │
│ Explainable  │ Partial        │ ✅ Full         │ ❌ Limited           │
├──────────────┴────────────────┴────────────────┴─────────────────────┤
│ Champion Model: Random Forest v2 (highest F1 on CICIDS2017)         │
│ Anomaly Sentinel: Isolation Forest (best zero-day capability)       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Reports Module

**Route:** `/reports` | **Priority:** 🟡 P1 | **Owner:** Full-Stack Dev

### 10.1 Report Types

| Report                    | Trigger                       | Content                                                       | Format |
| ------------------------- | ----------------------------- | ------------------------------------------------------------- | ------ |
| **Daily Threat Summary**  | Scheduled (6 AM) or on-demand | 24h alerts, top threats, anomaly trends, AI narrative         | PDF    |
| **Incident Report**       | Per-alert action              | Alert details, timeline, affected IPs, response actions       | PDF    |
| **Executive Briefing**    | On-demand                     | High-level threat posture, risk score, recommendations        | PDF    |
| **ML Performance Report** | On-demand                     | Model comparison, accuracy trends, retraining recommendations | PDF    |
| **Network Health Report** | Weekly scheduled              | Traffic patterns, protocol distribution, bandwidth trends     | PDF    |
| **Compliance Report**     | On-demand                     | Alert response times, resolution rates, SLA adherence         | PDF    |

---

## 11. Administration Module

**Route:** `/admin` | **Priority:** 🟢 P2 | **Owner:** Lead Architect

### 11.1 Sub-Pages

| Sub-Page               | Route               | Components                                               |
| ---------------------- | ------------------- | -------------------------------------------------------- |
| **User Management**    | `/admin/users`      | User CRUD, role assignment, activity log                 |
| **System Config**      | `/admin/config`     | Capture settings, alert thresholds, retention policy     |
| **LLM Budget**         | `/admin/llm-budget` | Token usage charts, provider breakdown, budget alerts    |
| **Feed Management**    | `/admin/feeds`      | Enable/disable feeds, sync schedules, API key management |
| **Capture Interfaces** | `/admin/capture`    | Select NICs, BPF filters, capture mode toggle            |
| **Audit Log**          | `/admin/audit`      | Full system audit trail (who did what and when)          |

### 11.2 LLM Budget Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│  LLM BUDGET MONITOR                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TOTAL BUDGET: $150.00    SPENT: $42.38 (28.3%)    REMAINING: $107.62│
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                            │
│                                                                      │
│  ┌─────────────────┬──────────┬──────────┬─────────────────────────┐ │
│  │ Provider        │ Spent    │ Requests │ Avg Cost/Request        │ │
│  ├─────────────────┼──────────┼──────────┼─────────────────────────┤ │
│  │ DeepSeek V3     │ $22.40   │ 1,247    │ $0.018                  │ │
│  │ GLM-4-Flash     │ $8.30    │ 4,150    │ $0.002                  │ │
│  │ Groq Llama 3.3  │ $11.68   │ 2,340    │ $0.005                  │ │
│  └─────────────────┴──────────┴──────────┴─────────────────────────┘ │
│                                                                      │
│  DAILY USAGE CHART (last 30 days)                                    │
│  [sparkline area chart showing daily spend]                          │
│                                                                      │
│  ⚠️ Budget Alert: Set alert at 80% ($120.00)                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Module Priority & Iteration Plan

### MVP Iteration 1 (Week 1-4): Core War Room

| Module        | Status | Deliverable                   |
| ------------- | ------ | ----------------------------- |
| War Room      | 🔴 P0  | Full layout with live data    |
| Network Flow  | 🔴 P0  | Traffic analysis panels       |
| Alert Console | 🔴 P0  | Alert listing and detail      |
| AI Analyst    | 🔴 P0  | Chat interface with streaming |
| Intel Hub     | 🔴 P0  | IOC browser and lookup        |
| Threat Hunt   | 🔴 P0  | Query builder and results     |

### MVP Iteration 2 (Week 5-6): Intelligence Layer

| Module        | Status | Deliverable                  |
| ------------- | ------ | ---------------------------- |
| Forensics Lab | 🟡 P1  | PCAP upload and analysis     |
| ML Operations | 🟡 P1  | Model dashboards, comparison |
| Reports       | 🟡 P1  | PDF generation               |

### MVP Iteration 3 (Week 7-8): Polish & Enterprise

| Module         | Status | Deliverable                     |
| -------------- | ------ | ------------------------------- |
| Administration | 🟢 P2  | User mgmt, config, budget       |
| i18n           | 🟢 P2  | Full Amharic/English toggle     |
| Polish         | 🟢 P2  | Animations, responsive, testing |

---

> **End of Part 3** — Continue to [Part 4: ML Pipeline, LLM Integration & Data Strategy](./MASTER_DOC_PART4_ML_LLM.md)

---

_ThreatMatrix AI Master Documentation v1.0 — Part 3 of 5_  
_© 2026 ThreatMatrix AI. All rights reserved._
