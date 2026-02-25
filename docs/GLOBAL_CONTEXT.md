# ThreatMatrix AI — Global Context Document v1.0

> **PURPOSE:** Paste this document into ANY AI model/chat session to instantly carry full project context. This is the single source of truth for cross-chat integration. Any task outlined in the Master Documentation can be started from this document.

> **LAST UPDATED:** 2026-02-25 | **PHASE:** Implementation (Week 1 / Day 1)

---

## STRICT RULES FOR ANY MODEL RECEIVING THIS DOCUMENT

1. You are helping build **ThreatMatrix AI** — an AI-powered network anomaly detection and cyber threat intelligence system.
2. This is a **senior project** at HiLCoE School Of Computer Science & Technology, BUT it must be **enterprise-grade and sellable**.
3. **DO NOT** deviate from the architecture, stack, or scope defined below. If a task contradicts this document, flag it.
4. **DO NOT** suggest Kafka, Kubernetes, Elasticsearch, or any overengineered infrastructure. We use Docker Compose on a single VPS.
5. **DO NOT** suggest paid mapping APIs (Mapbox, Google Maps). We use Deck.gl + Maplibre GL (free, open-source).
6. **DO NOT** add features not listed in the 10 modules below. Scope is locked.
7. All code must be **production-quality** — typed, error-handled, documented. No prototyping shortcuts.
8. Follow the file structure defined in Section 4 exactly. Do not reorganize.
9. When writing Python, use **type hints, Pydantic models, async/await**. When writing TypeScript, use **strict mode**.
10. The UI must follow the **War Room / Intelligence Agency** design language. Dark theme only. Glassmorphism. Cyan accents.

---

## 1. PROJECT IDENTITY

- **Name:** ThreatMatrix AI
- **Tagline:** "Intelligent Defense. Autonomous Vigilance."
- **Domain:** `threatmatrix-ai.vercel.app` (frontend) / VPS IP (backend API)
- **Team:** 4 members (Lead Architect, Full-Stack Dev, Business Manager, Tester)
- **Timeline:** Feb 24 → Apr 20, 2026 (8 weeks)
- **Current Phase:** Week 1 — Foundation

---

## 2. TECHNOLOGY STACK (LOCKED — DO NOT CHANGE)

| Layer                | Technology                  | Version      |
| -------------------- | --------------------------- | ------------ |
| **Frontend**         | Next.js (App Router)        | 16.x         |
| **Language (FE)**    | TypeScript                  | 5.x (strict) |
| **Styling**          | Vanilla CSS (CSS Variables) | —            |
| **Charts**           | Recharts                    | Latest       |
| **Maps**             | Deck.gl + Maplibre GL JS    | Latest       |
| **Animations**       | Framer Motion               | Latest       |
| **i18n**             | next-intl                   | Latest       |
| **Backend**          | FastAPI (Python)            | 0.115+       |
| **Language (BE)**    | Python                      | 3.11+        |
| **Database**         | PostgreSQL                  | 16           |
| **Cache/PubSub**     | Redis                       | 7            |
| **ORM**              | SQLAlchemy                  | 2.x          |
| **Migrations**       | Alembic                     | Latest       |
| **Packet Capture**   | Scapy                       | Latest       |
| **ML (Classical)**   | scikit-learn                | Latest       |
| **ML (Deep)**        | TensorFlow/Keras            | 2.x          |
| **PDF Reports**      | ReportLab                   | Latest       |
| **Containerization** | Docker + Docker Compose     | Latest       |
| **Reverse Proxy**    | Nginx                       | Alpine       |
| **SSL**              | Let's Encrypt (certbot)     | —            |
| **Frontend Hosting** | Vercel (free tier)          | —            |
| **Backend Hosting**  | VPS (Ubuntu 22.04, owned)   | —            |

---

## 3. ARCHITECTURE (THREE-TIER)

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: CAPTURE ENGINE (Python/Scapy)                       │
│ • Sniffs packets on VPS network interface                   │
│ • Aggregates into flows (5-tuple: src_ip, dst_ip,           │
│   src_port, dst_port, protocol)                             │
│ • Extracts 40+ features per flow                            │
│ • Publishes to Redis channel: flows:live                    │
│ • Persists to PostgreSQL: network_flows table               │
├─────────────────────────────────────────────────────────────┤
│ TIER 2: INTELLIGENCE ENGINE (FastAPI)                       │
│ • REST API (40+ endpoints) + WebSocket server               │
│ • ML Worker: subscribes to flows:live, runs 3 models,       │
│   computes ensemble score, creates alerts                   │
│ • LLM Gateway: routes to DeepSeek/GLM/Groq with caching    │
│ • Threat Intel: syncs OTX, AbuseIPDB, VirusTotal feeds      │
│ • Alert Engine: auto-creates alerts from anomaly scores     │
│ • Auth: JWT + RBAC (admin, soc_manager, analyst, viewer)    │
├─────────────────────────────────────────────────────────────┤
│ TIER 3: COMMAND CENTER (Next.js 16)                         │
│ • War Room dashboard (crown jewel — must be stunning)       │
│ • 10 modules total (see Section 5)                          │
│ • WebSocket client for real-time updates                    │
│ • Amharic/English bilingual (next-intl)                     │
│ • Hosted on Vercel, proxies API calls to VPS                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. FILE STRUCTURE (FOLLOW EXACTLY)

```
threatmatrix-ai/
├── docs/                           # Documentation
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config.py               # Settings (pydantic BaseSettings)
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   ├── dependencies.py         # Auth dependencies
│   │   ├── api/v1/                 # Route modules (auth, flows, alerts, ml, intel, llm, capture, reports, system)
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/               # Business logic layer
│   ├── capture/                    # Scapy capture engine
│   │   ├── engine.py
│   │   ├── flow_aggregator.py
│   │   └── feature_extractor.py
│   ├── ml/
│   │   ├── datasets/               # Dataset loaders (nsl_kdd.py, cicids2017.py)
│   │   ├── models/                 # Model implementations
│   │   ├── training/               # Training scripts
│   │   ├── inference/              # Real-time inference worker
│   │   └── saved_models/           # Serialized .pkl/.h5 files
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic/
├── frontend/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout (dark theme, sidebar)
│   │   ├── war-room/page.tsx
│   │   ├── hunt/page.tsx
│   │   ├── intel/page.tsx
│   │   ├── network/page.tsx
│   │   ├── ai-analyst/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── forensics/page.tsx
│   │   ├── ml-ops/page.tsx
│   │   ├── reports/page.tsx
│   │   └── admin/page.tsx
│   ├── components/                 # React components by module
│   ├── hooks/                      # Custom hooks (useWebSocket, useFlows, etc.)
│   ├── lib/                        # Utilities (api.ts, constants.ts)
│   ├── styles/globals.css          # Design system CSS variables
│   ├── messages/                   # i18n (en.json, am.json)
│   └── package.json
├── docker-compose.yml
├── docker-compose.dev.yml
├── nginx/nginx.conf
├── .env.example
└── Makefile
```

---

## 5. MODULES (10 TOTAL — SCOPE LOCKED)

| #   | Module             | Route         | Priority | Description                                                         |
| --- | ------------------ | ------------- | -------- | ------------------------------------------------------------------- |
| 1   | **War Room**       | `/war-room`   | P0       | Live threat map, metrics, alert feed, AI briefing, traffic timeline |
| 2   | **Threat Hunt**    | `/hunt`       | P0       | Query builder, flow search, drill-down analysis                     |
| 3   | **Intel Hub**      | `/intel`      | P0       | IOC browser, IP reputation, feed status, correlation                |
| 4   | **Network Flow**   | `/network`    | P0       | Traffic volume, top talkers, protocol breakdown, connection graph   |
| 5   | **AI Analyst**     | `/ai-analyst` | P0       | Conversational LLM chat, streaming responses, quick actions         |
| 6   | **Alert Console**  | `/alerts`     | P1       | Alert table, lifecycle mgmt, severity filtering, bulk actions       |
| 7   | **Forensics Lab**  | `/forensics`  | P1       | PCAP upload, analysis, packet inspector, timeline                   |
| 8   | **ML Operations**  | `/ml-ops`     | P1       | Model comparison, confusion matrix, ROC, feature importance         |
| 9   | **Reports**        | `/reports`    | P1       | PDF generation, daily briefing, incident reports                    |
| 10  | **Administration** | `/admin`      | P2       | User mgmt, config, LLM budget, feeds, audit log                     |

---

## 6. ML MODELS (3 MODELS — ENSEMBLE)

| Model                | Type                         | Library          | Role                                                   |
| -------------------- | ---------------------------- | ---------------- | ------------------------------------------------------ |
| **Isolation Forest** | Unsupervised                 | scikit-learn     | Zero-day anomaly detection                             |
| **Random Forest**    | Supervised (multi-class)     | scikit-learn     | Known attack classification (Normal/DoS/Probe/R2L/U2R) |
| **Autoencoder**      | Deep Learning (unsupervised) | TensorFlow/Keras | Complex pattern deviation                              |

**Ensemble Score:** `0.30 × IF_score + 0.45 × RF_confidence + 0.25 × AE_error`  
**Datasets:** NSL-KDD (primary), CICIDS2017 (secondary validation)

---

## 7. LLM PROVIDERS (COST-OPTIMIZED)

| Provider        | Model         | Use Case                    | Cost           |
| --------------- | ------------- | --------------------------- | -------------- |
| **DeepSeek**    | V3            | Complex analysis, reasoning | $0.14/M tokens |
| **Groq**        | Llama 3.3 70B | Real-time alerts (fastest)  | $0.06/M tokens |
| **GLM (Zhipu)** | GLM-4-Flash   | Bulk/translation (cheapest) | $0.01/M tokens |

**Total Budget:** $100-200 | **Projected monthly usage:** ~$0.50

---

## 8. DATABASE TABLES

`users`, `network_flows`, `alerts`, `threat_intel_iocs`, `ml_models`, `capture_sessions`, `pcap_uploads`, `llm_conversations`, `system_config`, `audit_log`

---

## 9. UI DESIGN SYSTEM

- **Theme:** Dark only — `#0a0a0f` base, `#111118` panels, `#1a1a24` cards
- **Accent:** Cyber cyan `#00f0ff` (primary), `#ef4444` (critical), `#f97316` (high), `#22c55e` (safe)
- **Fonts:** `JetBrains Mono` (data/metrics), `Inter` (UI labels)
- **Style:** Glassmorphism panels, backdrop blur, scan-line animations, glow effects
- **Vibe:** Intelligence agency war room — NOT a SaaS dashboard

---

## 10. CURRENT SPRINT (WEEK 1: Feb 24 — Mar 2)

| Task                                    | Owner      | Status       |
| --------------------------------------- | ---------- | ------------ |
| Monorepo init, Docker Compose, CI       | Lead       | 🔨 Today     |
| PostgreSQL schema + Alembic migrations  | Lead       | 📋 This week |
| FastAPI skeleton: auth, health, CORS    | Lead       | 📋 This week |
| Next.js 16 init: layout, sidebar, theme | Full-Stack | 📋 This week |
| Redis setup + pub/sub test              | Lead       | 📋 This week |
| Design system CSS                       | Full-Stack | 📋 This week |

---

## 11. REFERENCE DOCUMENTS

All detailed specifications live in `/docs/`:

- `MASTER_DOC_PART1_STRATEGY.md` — Business case, market, risks
- `MASTER_DOC_PART2_ARCHITECTURE.md` — DB schema, API spec, security
- `MASTER_DOC_PART3_MODULES.md` — Module specs, UI/UX design system
- `MASTER_DOC_PART4_ML_LLM.md` — ML pipeline, LLM gateway, prompts
- `MASTER_DOC_PART5_TIMELINE.md` — Sprint plan, deployment, testing

**When you need detail on any section, ask for the specific Part number.**

---

_END OF GLOBAL CONTEXT — Any AI model receiving this document has full authority to assist with ThreatMatrix AI implementation within the constraints defined above._
