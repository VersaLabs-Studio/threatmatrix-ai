# ThreatMatrix AI — Team Roles & Contributions

> **Document Version:** v1.0.0  
> **Date:** April 2026  
> **Project:** ThreatMatrix AI — AI-Powered Network Anomaly Detection and Cyber Threat Intelligence System  
> **Context:** Bachelor's Degree Senior Project — Computer Science  
> **Institution:** ASTU (Adama Science and Technology University)  
> **Meeting Use:** Advisor presentation script — read top-to-bottom  

---

## 1. Document Header

### 1.1 Project Identity

**ThreatMatrix AI** is an enterprise-grade, AI-powered cybersecurity platform that provides real-time network anomaly detection and cyber threat intelligence through a unified War Room command center. The system combines three distinct machine learning models (Isolation Forest, Random Forest, Autoencoder) with multi-provider LLM integration to deliver predictive threat analysis, automated incident response narratives, and actionable intelligence — all presented through a military-grade operational UI inspired by real-world intelligence agency cyber operations centers. *(Source: `MASTER_DOC_PART1_STRATEGY.md` §1.1)*

### 1.2 Team Roster

| Name | Title | One-Line Scope |
|------|-------|----------------|
| **Kidus Abdula** | Lead Senior Software Engineer & Systems Architect | Full architecture, backend, ML pipeline, LLM gateway, capture engine, deployment, technical documentation |
| **Caleb Demelash** | Full-Stack Engineer | Next.js 16 frontend, War Room UI, data visualization, API wiring, design system |
| **Dinaol Seyoum** | Business Manager | Market research, business plan, budget, presentation materials, advisor communications |
| **Kirubel Tewodros** | QA & Tester | Test plans, attack simulation, UAT, Amharic translations, demo rehearsal |

---

## 2. Executive Summary of Contributions

### 2.1 What the Team Built

Over an 8-week development window (February 24 — April 20, 2026), the team shipped ThreatMatrix AI v1.0.0: a production-grade cybersecurity platform running on a live Hostinger KVM VPS, processing real network traffic, with 46 operational REST API endpoints, 10 functional frontend modules, three trained ML models scoring traffic in real-time, an OpenRouter-powered LLM gateway routing across five free-tier models, and a fully bilingual English/Amharic interface.

The system is not a prototype — it is a deployable product. One `docker compose up -d` command launches five containers (PostgreSQL, Redis, FastAPI backend, Scapy capture engine, ML inference worker) behind an Nginx reverse proxy with SSL. The VPS has demonstrated 5+ consecutive days of continuous uptime.

### 2.2 How Responsibility Was Distributed

| Team Member | Hours/Week | Total Hours (8 weeks) | Codebase Share | Deliverable Type |
|-------------|------------|----------------------|----------------|------------------|
| Kidus Abdula (Lead) | 40–60 | 320–480 | ~60% | Backend, ML, infrastructure, architecture docs |
| Caleb Demelash (Full-Stack) | 30–40 | 240–320 | ~30% | Frontend application, UI components, design system |
| Kirubel Tewodros (Tester) | 10–15 | 80–120 | ~10% + testing | Test plans, attack scripts, translations, QA |
| Dinaol Seyoum (Business) | 15–20 | 120–160 | Non-code | Business docs, presentations, budget, market research |

*(Source: `MASTER_DOC_PART1_STRATEGY.md` §1.4; `MASTER_DOC_PART5_TIMELINE.md` §4.2)*

The distribution is honest: the Lead Architect's scope dominates the codebase by design, because the project is backend-heavy (ML pipeline, capture engine, LLM gateway, threat intelligence correlation). The Full-Stack Engineer's contribution is concentrated entirely in the Next.js 16 frontend. The QA & Tester's work spans test documentation, attack simulation, and the complete Amharic i18n dictionary. The Business Manager owns every non-technical deliverable required for academic submission and commercial viability.

---

## 3. Feature Ownership Matrix

This matrix reproduces the authoritative allocation from `MASTER_DOC_PART5_TIMELINE.md` §4.1. Each bar (█) represents one unit of ownership: six bars = sole/full ownership, four bars = major ownership, two bars = minor/supporting ownership.

| Feature | Kidus Abdula (Lead) | Caleb Demelash (Full-Stack) | Dinaol Seyoum (Business) | Kirubel Tewodros (Tester) |
|---------|:-------------------:|:---------------------------:|:------------------------:|:-------------------------:|
| FastAPI Backend | ██████ | | | |
| Database Schema | ██████ | | | |
| Capture Engine | ██████ | | | |
| ML Pipeline | ██████ | | | |
| LLM Gateway | ██████ | | | |
| Alert Engine | ██████ | | | |
| WebSocket Server | ██████ | | | |
| War Room UI | ██ | ██████ | | |
| All Other UI | | ██████ | | |
| Design System | ██ | ██████ | | |
| i18n Setup | | ████ | | ██ |
| Amharic Translations | | | | ██████ |
| Business Documents | | | ██████ | |
| Presentation | | | ██████ | |
| Market Research | | | ██████ | |
| Test Plan | | | | ██████ |
| Testing Execution | | | | ██████ |
| Attack Simulation | ████ | | | ██ |
| Documentation | ████ | | ██ | |
| Deployment | ██████ | | | |

---

## 4. Individual Contribution Profiles

Each profile follows the same five-subsection template for consistent scan-reading during the advisor meeting.

---

### 4.1 Kidus Abdula — Lead Senior Software Engineer & Systems Architect

#### 4.1.1 Role Statement

Kidus Abdula served as the Lead Senior Software Engineer and Systems Architect, owning the full technical backbone of ThreatMatrix AI. This included system architecture, backend engineering, machine learning pipeline design, LLM integration, packet capture engine development, deployment infrastructure, and all master technical documentation. The role also encompassed frontend task delegation, architectural review, and final integration unblocking.

#### 4.1.2 Scope of Work

- Authored the complete 5-part Master Documentation (~120 pages) and 2 Progress Reports
- Wrote 23+ daily worklog files in `docs/worklog/` tracking technical progress
- Built the FastAPI backend application factory, 46 REST endpoints, JWT authentication, RBAC (4 roles), and 10 PostgreSQL tables with Alembic migrations
- Developed the Scapy-based capture engine with 5-tuple flow aggregation, 63-feature extraction, and Redis pub/sub publishing
- Implemented the complete ML pipeline: NSL-KDD + CICIDS2017 loaders, Isolation Forest, Random Forest, TensorFlow Autoencoder, ensemble scorer, model manager, training orchestrator, and hyperparameter tuning
- Built the OpenRouter LLM Gateway with multi-model routing, prompt templates, streaming SSE, caching, and budget tracking
- Integrated threat intelligence aggregation (AlienVault OTX, AbuseIPDB, VirusTotal) and the IOC Correlation Engine
- Created the real-time inference worker (Redis subscriber → ensemble scoring → auto-alert creation)
- Implemented ReportLab PDF report generation pipeline
- Deployed the full Docker Compose stack (5 containers) on a Hostinger KVM VPS, configured Nginx reverse proxy, SSL via Let's Encrypt, and production hardening

#### 4.1.3 Concrete Deliverables

| Deliverable | Location | Evidence |
|-------------|----------|----------|
| Master Documentation (5 parts) | `docs/master-documentation/` | `MASTER_DOC_PART1_STRATEGY.md` through `MASTER_DOC_PART5_TIMELINE.md` |
| Daily Worklogs | `docs/worklog/` | 23+ daily log files |
| ML Evaluation Report | `docs/ThreatMatrix_AI_Day10_Report.md` | Academic metrics and model comparison |
| FastAPI Backend | `backend/app/` | App factory, routers, services, schemas |
| Capture Engine | `backend/capture/` | `engine.py`, `flow_aggregator.py`, `feature_extractor.py` |
| ML Pipeline | `backend/ml/` | `datasets/`, `models/`, `training/`, `inference/` |
| Ensemble Scorer | `backend/ml/inference/ensemble_scorer.py` | Composite weighted scoring implementation |
| Inference Worker | `backend/ml/inference/worker.py` | Real-time scoring loop |
| LLM Gateway | `backend/app/services/llm_gateway.py` | Multi-provider router with fallback chain |
| Threat Intel Service | `backend/app/services/threat_intel.py` | OTX/AbuseIPDB/VirusTotal aggregation |
| IOC Correlator | `backend/app/services/ioc_correlator.py` | Flow-to-IOC correlation engine |
| Reports API | `backend/app/api/v1/reports.py` | ReportLab PDF generation endpoints |
| Docker Compose Stack | `docker-compose.yml` | 5-container orchestration |
| Nginx Configuration | `nginx/nginx.conf` | Reverse proxy + SSL |

#### 4.1.4 Quantified Impact

| Metric | Value | Source |
|--------|-------|--------|
| REST API Endpoints | 46 / 46 (100%) | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| ML Models Trained | 3 + ensemble | `backend/ml/models/` |
| Ensemble Accuracy | 80.73% | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Ensemble AUC-ROC | 0.9312 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Average Inference Latency | 146 ms | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| IOCs Ingested | 1,367 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| PostgreSQL Tables | 10 normalized tables | `MASTER_DOC_PART5_TIMELINE.md` §2.1 |
| VPS Uptime | 5+ consecutive days | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Docker Containers | 5 healthy containers | `docker-compose.yml` |
| OpenRouter Models | 5 free-tier models routed | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §7 |
| Weekly Effort | 40–60 hours/week | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Total Estimated Effort | 320–480 hours | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Codebase Ownership | ~60% | `MASTER_DOC_PART1_STRATEGY.md` §1.4 |

#### 4.1.5 Weekly Timeline Cross-Reference

| Week | Primary Focus | Key Deliverables |
|------|---------------|------------------|
| Week 1 | Foundation | Monorepo init, Docker Compose, PostgreSQL schema, Alembic, FastAPI skeleton, Redis pub/sub |
| Week 2 | Capture + Core Pipeline | Scapy capture engine, 5-tuple flow aggregation, 63-feature extraction, real-time flow publishing |
| Week 3 | ML Training | NSL-KDD preprocessing, Isolation Forest, Random Forest, Autoencoder training, ensemble scorer |
| Week 4 | Intelligence Integration | LLM Gateway (later migrated to OpenRouter), AI Analyst backend, threat intel aggregator, real-time inference worker, alert engine |
| Week 5 | Feature Depth | Anomaly scoring refinement, PCAP processor, WebSocket broadcasting, CICIDS2017 secondary validation |
| Week 6 | Reports + Enterprise | ReportLab PDF generation, RBAC enforcement, LLM budget tracking, system health monitoring |
| Week 7 | Polish + Optimization | Query tuning, model retraining with optimized hyperparameters, pre-built PCAP demo scenarios, attack simulation scripts |
| Week 8 | Final Push | Production VPS deployment, SSL/Let's Encrypt, security hardening, API documentation finalization |

*(Source: `MASTER_DOC_PART5_TIMELINE.md` §3)*

---

### 4.2 Caleb Demelash — Full-Stack Engineer

#### 4.2.1 Role Statement

Caleb Demelash served as the Full-Stack Engineer, owning the entire Next.js 16 frontend application, the Deep Space design system, and all user-facing visualization components. The role required translating backend APIs into a military-grade War Room interface, implementing real-time WebSocket consumption, building 10 distinct module pages, and ensuring responsive, animated, accessible UI across the application.

#### 4.2.2 Scope of Work

- Initialized and scaffolded the Next.js 16 App Router project with TypeScript strict mode
- Implemented the Deep Space dark-theme design system using pure CSS variables (no Tailwind), including glassmorphism panels, JetBrains Mono data typography, Inter UI typography, and cyber-cyan accent colors
- Built the War Room command center with 9 live components: MetricCard, ThreatMap (Deck.gl + Maplibre), ProtocolChart, TrafficTimeline, TopTalkers, LiveAlertFeed, ThreatLevel gauge, AIBriefingWidget, and GeoDistribution
- Developed the AI Analyst chat interface with streaming SSE responses and the AnalysisPanel/QueryBuilder
- Built the Alert Console with severity filtering, sortable data tables, and detail drawers
- Created the ML Operations dashboard with model comparison tables, confusion matrices, ROC curves, feature importance charts, and retrain polling
- Implemented the Intel Hub, Forensics Lab, Reports, Threat Hunt, Administration, and Network Flow module UIs
- Authored custom React hooks for data fetching and real-time updates: `useWebSocket`, `useFlows`, `useAlerts`, `useLLM`
- Built the API client layer (`api.ts`) and WebSocket client (`websocket.ts`)
- Added responsive layouts, Framer Motion page transitions, and polished loading/empty/error states
- Participated in the Day 18 integration sprint wiring remaining frontend pages to live VPS APIs

#### 4.2.3 Concrete Deliverables

| Deliverable | Location | Evidence |
|-------------|----------|----------|
| Next.js 16 App Shell | `frontend/app/` | 10+ module pages with App Router |
| Design System | `frontend/app/globals.css` | CSS variables, glassmorphism, color system |
| Shared Components | `frontend/components/shared/` | `GlassPanel.tsx`, `DataTable.tsx`, `StatusBadge.tsx`, `LoadingState.tsx` |
| War Room Components | `frontend/components/war-room/` | `ThreatMap.tsx`, `ThreatGauge.tsx`, `LiveAlertFeed.tsx`, `MetricCard.tsx`, `ProtocolChart.tsx`, `TrafficTimeline.tsx`, `TopTalkers.tsx`, `GeoDistribution.tsx`, `AIBriefingWidget.tsx` |
| AI Analyst Components | `frontend/components/ai-analyst/` | `ChatInterface.tsx`, `QuickActions.tsx`, `ContextPanel.tsx` |
| Alert Components | `frontend/components/alerts/` | `AlertTable.tsx`, `AlertDetail.tsx`, `AlertTimeline.tsx` |
| ML Ops Dashboard | `frontend/app/ml-ops/` | Model comparison, confusion matrices, ROC curves, feature importance |
| Custom Hooks | `frontend/hooks/` | `useWebSocket.ts`, `useFlows.ts`, `useAlerts.ts`, `useMLModels.ts`, `useLLM.ts` |
| API Client | `frontend/lib/api.ts` | Fetch wrapper with auth headers |
| WebSocket Client | `frontend/lib/websocket.ts` | Real-time connection manager |
| Administration UI | `frontend/app/admin/` | User management, config, LLM budget, audit pages |

#### 4.2.4 Quantified Impact

| Metric | Value | Source |
|--------|-------|--------|
| Frontend Modules Shipped | 10 / 10 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §5 |
| War Room Components | 9 live widgets | `frontend/components/war-room/` |
| Frontend Pages | 10+ routed pages | `frontend/app/` |
| Custom React Hooks | 5 data hooks | `frontend/hooks/` |
| Shared UI Components | 4+ reusable primitives | `frontend/components/shared/` |
| Zero Tailwind CSS | Pure CSS variables | `frontend/app/globals.css` |
| Weekly Effort | 30–40 hours/week | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Total Estimated Effort | 240–320 hours | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Codebase Ownership | ~30% | `MASTER_DOC_PART1_STRATEGY.md` §1.4 |

#### 4.2.5 Weekly Timeline Cross-Reference

| Week | Primary Focus | Key Deliverables |
|------|---------------|------------------|
| Week 1 | UI Foundation | Next.js 16 init, layout, sidebar, dark theme shell, CSS variables, `GlassPanel` |
| Week 2 | Core Components | War Room grid layout, `MetricCard`, `StatusBadge`, `DataTable`, `useWebSocket.ts` |
| Week 3 | Maps & Charts | `ThreatMap` (Deck.gl + Maplibre), `TrafficTimeline`, `ProtocolChart`, Network Flow layout |
| Week 4 | Intelligence UI | AI Analyst chat interface (streaming), Intel Hub, Alert Console table + drawer |
| Week 5 | Feature Depth | `LiveAlertFeed`, `TopTalkers`, `GeoDistribution`, Forensics Lab UI, ML Ops dashboard |
| Week 6 | Enterprise UI | Reports module, Admin panel, LLM Budget dashboard, enhanced Network Flow |
| Week 7 | Polish + i18n | Responsive layouts, Framer Motion animations, loading/error states, i18n scaffold |
| Week 8 | Final Fixes | UI bug fixes, pixel-perfect War Room polish, theme toggle (stretch) |

*(Source: `MASTER_DOC_PART5_TIMELINE.md` §3)*

---

### 4.3 Dinaol Seyoum — Business Manager

#### 4.3.1 Role Statement

Dinaol Seyoum served as the Business Manager, owning all non-technical deliverables required for academic submission, commercial credibility, and advisor communication. The role encompassed market analysis, business planning, financial modeling, presentation materials, legal documentation, and end-user documentation. Dinaol's work provided the commercial and academic context that frames ThreatMatrix AI as a viable enterprise product, not merely a student project.

#### 4.3.2 Scope of Work

- Conducted competitive market analysis: competitor matrix (Splunk, QRadar, Elastic SIEM, Wazuh, Snort), SWOT analysis, and pricing benchmarks feeding `MASTER_DOC_PART1_STRATEGY.md` §5
- Authored the Business Plan & Revenue Model with tiered SaaS pricing (Sentinel / Guardian / Warden), unit economics, CAC/MRR/margin tables, and revenue projections for Years 1–3
- Defined target customer personas: government (INSA), financial (CBE, Dashen, Awash, Telebirr), telecom (Ethio Telecom, Safaricom Ethiopia), universities, and SMEs
- Created the `Budget_Allocation.md` / `.pdf` document tracking project finances
- Drafted the legal framework document authorizing VPS traffic capture
- Collaborated on the Defense Presentation script (`docs/DEFENSE_PRESENTATION_SCRIPT.md`)
- Authored advisor communications including the reschedule request document
- Produced the end-user manual PDF (Week 8 deliverable)
- Delivered presentation slides and demo script contributions
- Presented the Problem/Market section (Section 2) and Business Case section (Section 8) during demo day per `MASTER_DOC_PART5_TIMELINE.md` §8.1

#### 4.3.3 Concrete Deliverables

| Deliverable | Location | Evidence |
|-------------|----------|----------|
| Budget Allocation | `docs/Budget_Allocation.md` / `.pdf` | $170 total budget, $3.40 spent, $166.60 remaining |
| Defense Presentation Script | `docs/DEFENSE_PRESENTATION_SCRIPT.md` | Collaborative business/presentation artifact |
| Advisor Reschedule Request | `docs/ThreatMatrix_AI_Defense_Reschedule_Request.md` | Formal advisor-comms artifact |
| Market & Competitive Analysis | Embedded in `MASTER_DOC_PART1_STRATEGY.md` §5 | Competitor matrix, SWOT, pricing benchmarks |
| Business Plan & Revenue Model | Embedded in `MASTER_DOC_PART1_STRATEGY.md` §6 | Tiered SaaS, unit economics, projections |
| Target Customer Personas | Embedded in `MASTER_DOC_PART1_STRATEGY.md` §7 | 5 segments with budget ranges and decision cycles |
| User Manual | Week 8 PDF deliverable | End-user operating guide |
| Presentation Slides | Week 8 deliverable | Advisor meeting and defense slides |

#### 4.3.4 Quantified Impact

| Metric | Value | Source |
|--------|-------|--------|
| Budget Tracked | $170 total / $3.40 spent / $166.60 remaining | `docs/Budget_Allocation.md` |
| Revenue Tiers Defined | 3 (Sentinel / Guardian / Warden) | `MASTER_DOC_PART1_STRATEGY.md` §6.1 |
| Customer Segments Mapped | 5 primary segments | `MASTER_DOC_PART1_STRATEGY.md` §7 |
| Gross Margin Modeled | 85–92% | `MASTER_DOC_PART1_STRATEGY.md` §6.3 |
| Demo Sections Owned | 2 of 9 (Problem/Market + Business Case) | `MASTER_DOC_PART5_TIMELINE.md` §8.1 |
| Weekly Effort | 15–20 hours/week | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Total Estimated Effort | 120–160 hours | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Codebase Ownership | Non-code deliverables | `MASTER_DOC_PART1_STRATEGY.md` §1.4 |

#### 4.3.5 Weekly Timeline Cross-Reference

| Week | Primary Focus | Key Deliverables |
|------|---------------|------------------|
| Week 1 | Legal & Framework | VPS traffic-capture authorization document |
| Week 2 | Market Research | Competitive analysis report |
| Week 3 | Competitor Deep-Dive | Completed competitor analysis, user personas |
| Week 4 | Use Cases & Personas | User personas, use-case documentation |
| Week 5 | Presentation Draft | Demo script draft, slide deck start |
| Week 6 | Financial Modeling | Revenue projection model, business plan polish |
| Week 7 | Final Business Docs | Final business plan, presentation slides |
| Week 8 | Submission Package | User manual PDF, presentation rehearsal |

*(Source: `MASTER_DOC_PART5_TIMELINE.md` §3)*

---

### 4.4 Kirubel Tewodros — QA & Tester

#### 4.4.1 Role Statement

Kirubel Tewodros served as the QA & Tester, owning the quality assurance lifecycle, attack simulation infrastructure, dataset validation, API testing, integration testing, and the complete Amharic localization of the frontend. The role ensured that every component — from ML model accuracy to end-to-end Docker Compose flows — was verified before demo day, and that the system was fully accessible to Amharic-speaking analysts.

#### 4.4.2 Scope of Work

- Authored the comprehensive test plan covering unit tests, API tests, ML accuracy tests, integration tests, UAT, and performance tests (`MASTER_DOC_PART5_TIMELINE.md` §7.1)
- Created attack simulation scripts: nmap port-scan, hping3 DDoS flood, iodine DNS-tunneling, hydra SSH brute-force, plus benign baseline traffic — each mapped to expected severity levels (`MASTER_DOC_PART5_TIMELINE.md` §7.3)
- Validated dataset integrity for NSL-KDD (125,973 train / 22,544 test samples) and the CICIDS2017 loader
- Executed API testing across all 46 REST endpoints using Postman and curl; recorded results in test reports
- Performed integration and end-to-end testing of the full capture → Redis → ML scoring → alert → WebSocket → UI pipeline across the Docker Compose stack
- Authored the complete Amharic i18n dictionary in `frontend/messages/am.json`, including translations for War Room, Alerts, AI Analyst, and admin surfaces
- Conducted UAT execution: demo scenario dry-runs and go/no-go checklist sign-off
- Drove the 20-minute demo walkthrough rehearsals in Week 8
- Validated the pre-demo checklist: VPS uptime, LLM availability, IOC freshness, PDF report generation, Amharic locale load, backup video readiness, second laptop configuration

#### 4.4.3 Concrete Deliverables

| Deliverable | Location | Evidence |
|-------------|----------|----------|
| Test Plan Document | `MASTER_DOC_PART5_TIMELINE.md` §7.1 | Layered test strategy (unit/API/ML/integration/UAT/performance) |
| Attack Simulation Scripts | `MASTER_DOC_PART5_TIMELINE.md` §7.3 | nmap, hping3, iodine, hydra scenarios with severity mapping |
| API Test Results | Test report documents | Postman/curl coverage of 46 endpoints |
| Integration Test Report | End-to-end validation | Full Docker Compose pipeline verification |
| Amharic Translations | `frontend/messages/am.json` | Complete i18n dictionary |
| UAT Report | Week 8 deliverable | Go/no-go checklist, demo scenario validation |
| Pre-Demo Checklist Validation | Week 8 execution | VPS uptime, LLM health, IOC sync, PDF generation, Amharic load |

#### 4.4.4 Quantified Impact

| Metric | Value | Source |
|--------|-------|--------|
| Test Layers Owned | 6+ (unit, API, ML, integration, UAT, performance) | `MASTER_DOC_PART5_TIMELINE.md` §7.1 |
| Attack Scenarios Scripted | 5 (port scan, DDoS, DNS tunnel, SSH brute-force, benign baseline) | `MASTER_DOC_PART5_TIMELINE.md` §7.3 |
| API Endpoints Tested | 46 / 46 | Integration test coverage |
| Dataset Samples Verified | NSL-KDD 125,973 train / 22,544 test | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §6 |
| Languages Supported | 2 (English + Amharic) | `frontend/messages/am.json` |
| Demo Rehearsals Driven | 20-minute walkthroughs in Week 8 | `MASTER_DOC_PART5_TIMELINE.md` §8.3 |
| Weekly Effort | 10–15 hours/week | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Total Estimated Effort | 80–120 hours | `MASTER_DOC_PART5_TIMELINE.md` §4.2 |
| Codebase Ownership | ~10% + testing scope | `MASTER_DOC_PART1_STRATEGY.md` §1.4 |

#### 4.4.5 Weekly Timeline Cross-Reference

| Week | Primary Focus | Key Deliverables |
|------|---------------|------------------|
| Week 1 | Test Planning | Test plan document draft, dev environment setup |
| Week 2 | Test Data Generation | Sample flow/alert data scripts |
| Week 3 | Dataset Validation | NSL-KDD and CICIDS2017 data integrity verification |
| Week 4 | API Testing | Postman/curl test suite for all endpoints |
| Week 5 | Integration Testing | End-to-end capture → alert → UI test results |
| Week 6 | E2E Testing | Full system test report |
| Week 7 | i18n + UAT | Amharic translation review, UAT execution |
| Week 8 | Final QA + Rehearsal | Final QA pass, demo day rehearsal, go/no-go decision |

*(Source: `MASTER_DOC_PART5_TIMELINE.md` §3)*

---

## 5. Shared Responsibilities & Collaboration Points

No team member worked in complete isolation. The following collaborative interfaces were critical to shipping v1.0:

| Collaboration Area | Primary Owner | Supporting Owner | Description |
|--------------------|---------------|------------------|-------------|
| **i18n Setup** | Caleb Demelash | Kirubel Tewodros | Caleb scaffolded the Next.js i18n framework and `messages/` directory structure; Kirubel authored 100% of the Amharic content in `frontend/messages/am.json` |
| **Attack Simulation** | Kidus Abdula | Kirubel Tewodros | Kidus built the capture infrastructure and VPS environment that enabled live attack detection; Kirubel authored and executed the attack scripts (nmap, hping3, iodine, hydra) |
| **Documentation** | Kidus Abdula | Dinaol Seyoum | Kidus authored all technical and architectural documentation (Master Docs, worklogs, ML reports); Dinaol authored all business-facing documentation (business plan, user manual, budget, presentation materials) |
| **Demo Day Presentation** | All members | — | Kidus presented the Hook, Architecture, Live Demo, ML Results, and Close; Caleb presented the Enterprise section (Admin/Reports); Dinaol presented Problem/Market and Business Case; Kirubel managed backstage QA and backup execution |

---

## 6. Timeline Alignment (Weeks 1–8)

The table below reproduces the per-week owner assignments from `MASTER_DOC_PART5_TIMELINE.md` §3, showing how each member's scope interlocked across the 8-week lifecycle.

| Week | Theme | Kidus Abdula | Caleb Demelash | Dinaol Seyoum | Kirubel Tewodros |
|------|-------|--------------|----------------|---------------|------------------|
| 1 | Foundation | Monorepo, Docker Compose, PostgreSQL schema, Alembic, FastAPI skeleton, Redis | Next.js 16 init, layout, sidebar, dark theme, CSS variables, `GlassPanel` | Legal framework for VPS capture | Test plan draft, dev env setup |
| 2 | Capture + Core UI | Scapy capture engine, 5-tuple flow aggregation, 63-feature extraction, Redis pub/sub | War Room grid, `MetricCard`, `StatusBadge`, `DataTable`, `useWebSocket.ts` | Market research document | Test data generation scripts |
| 3 | ML Pipeline | NSL-KDD preprocessing, 3 ML models trained, ensemble scorer, evaluation framework | `ThreatMap` (Deck.gl + Maplibre), `TrafficTimeline`, `ProtocolChart`, Network Flow layout | Competitor analysis report | Dataset validation testing |
| 4 | Intelligence Integration | LLM Gateway, AI Analyst backend, threat intel aggregator, inference worker, alert engine | AI Analyst chat UI (streaming), Intel Hub, Alert Console table + drawer | User personas, use-case docs | API testing (Postman/curl) |
| 5 | Feature Depth | Anomaly scoring refinement, PCAP processor, WebSocket broadcasting, CICIDS2017 validation | `LiveAlertFeed`, `TopTalkers`, `GeoDistribution`, Forensics Lab UI, ML Ops dashboard | Demo script draft, slide deck start | Integration testing |
| 6 | Reports + Enterprise | ReportLab PDF generation, RBAC enforcement, LLM budget tracking, system health | Reports module UI, Admin panel, LLM Budget dashboard, enhanced Network Flow | Revenue projection model | End-to-end testing |
| 7 | Polish + i18n | Performance optimization, model retraining, pre-built PCAP demo scenarios, attack scripts | Responsive design, Framer Motion animations, loading/error states, i18n scaffold | Final business plan, presentation slides | UAT testing, Amharic translation review |
| 8 | Final Push | Production deployment, SSL, security hardening, API docs finalization | Final UI bug fixes, pixel-perfect War Room polish | Presentation rehearsal, user manual PDF | Final QA, demo day rehearsal, go/no-go |

---

## 7. Version Tag Ownership (v0.1.0 → v1.0.0)

Each version milestone below cross-references `MASTER_DOC_PART5_TIMELINE.md` §5.1 and attributes the primary drivers.

| Version | Date | Milestone | Primary Driver(s) |
|---------|------|-----------|-------------------|
| v0.1.0 | Week 1 | Project skeleton, database, auth, UI shell | Kidus Abdula |
| v0.2.0 | Week 2 | Capture engine, flow storage, War Room layout | Kidus Abdula |
| v0.3.0 | Week 3 | ML models trained, basic scoring, map + charts | Kidus Abdula |
| v0.4.0 | Week 4 | LLM integration, AI Analyst, threat intel, alerts | Kidus Abdula + Caleb Demelash |
| v0.5.0 | Week 5 | PCAP forensics, ML dashboards, full War Room | Caleb Demelash + Kidus Abdula; validated by Kirubel Tewodros |
| v0.6.0 | Week 6 | Reports, admin, RBAC, budget tracking | Kidus Abdula (backend) + Caleb Demelash (admin UI) + Dinaol Seyoum (business polish) |
| v0.7.0 | Week 7 | Polish, animations, i18n, demo scenarios | Caleb Demelash + Kirubel Tewodros + Dinaol Seyoum |
| v1.0.0 | Week 8 | Production deployment, final fixes, documentation | Kidus Abdula (deployment lead); whole team (rehearsal and sign-off) |

---

## 8. Closing — Combined Team Outcome

ThreatMatrix AI v1.0.0 is the sum of four distinct, necessary contributions. The Lead Architect's scope dominated the codebase by design — the project is fundamentally a backend-and-ML-heavy system — but v1.0 does not ship without every member executing their charter.

### 8.1 v1.0 System Metrics

| Metric | Value | Source |
|--------|-------|--------|
| API Endpoints Live | 46 / 46 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Frontend Modules Shipped | 10 / 10 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §5 |
| ML Models + Ensemble | 3 models + ensemble scorer | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §6 |
| Ensemble Accuracy | 80.73% | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Ensemble AUC-ROC | 0.9312 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Average Inference Latency | 146 ms | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| IOCs Ingested | 1,367 | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| VPS Continuous Uptime | 5+ days | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §4 |
| Budget Spent / Total | $3.40 / $170 | `docs/Budget_Allocation.md` |
| LLM Operational Cost | $0.00 / month (OpenRouter free tier) | `PRESENTATION_SCRIPT_ADVISOR_MEETING.md` §7 |
| UI Languages | English + Amharic | `frontend/messages/am.json` |
| Docker Containers | 5 healthy containers | `docker-compose.yml` |
| PostgreSQL Tables | 10 normalized tables | `MASTER_DOC_PART5_TIMELINE.md` §2.1 |

### 8.2 Closing Statement

Each contribution was necessary. The Lead Engineer authored the architectural backbone that makes the system technically credible. The Full-Stack Engineer built the visual interface that makes the system demoable and sellable. The QA & Tester ensured the system was verified, localized, and rehearsal-ready. The Business Manager provided the commercial and academic framing that elevates the project from a class assignment to a viable product. v1.0 required all four scopes; no single member could have delivered it alone.

---

## 9. Appendix — Evidence Index

This index maps claims in the present document to their source artifacts.

### 9.1 Technical Artifacts

| Claim | Artifact Path |
|-------|---------------|
| 46 REST API endpoints | `backend/app/api/v1/` |
| FastAPI application factory | `backend/app/main.py` |
| JWT auth + RBAC | `backend/app/dependencies.py`, `backend/app/services/auth_service.py` |
| Capture engine (Scapy) | `backend/capture/engine.py` |
| Flow aggregator | `backend/capture/flow_aggregator.py` |
| 63-feature extractor | `backend/capture/feature_extractor.py` |
| NSL-KDD loader | `backend/ml/datasets/nsl_kdd.py` |
| CICIDS2017 loader | `backend/ml/datasets/cicids2017.py` |
| Isolation Forest model | `backend/ml/models/isolation_forest.py` |
| Random Forest model | `backend/ml/models/random_forest.py` |
| Autoencoder model | `backend/ml/models/autoencoder.py` |
| Ensemble scorer | `backend/ml/inference/ensemble_scorer.py` |
| Inference worker | `backend/ml/inference/worker.py` |
| LLM Gateway | `backend/app/services/llm_gateway.py` |
| Threat intel service | `backend/app/services/threat_intel.py` |
| IOC Correlator | `backend/app/services/ioc_correlator.py` |
| Report generation | `backend/app/api/v1/reports.py`, `backend/app/services/report_generator.py` |
| Alembic migrations | `backend/alembic/versions/` |
| Docker Compose stack | `docker-compose.yml` |
| Nginx reverse proxy | `nginx/nginx.conf` |

### 9.2 Frontend Artifacts

| Claim | Artifact Path |
|-------|---------------|
| Next.js 16 app shell | `frontend/app/` |
| Design system (CSS variables) | `frontend/app/globals.css` |
| GlassPanel component | `frontend/components/shared/GlassPanel.tsx` |
| War Room components | `frontend/components/war-room/` |
| AI Analyst components | `frontend/components/ai-analyst/` |
| Alert components | `frontend/components/alerts/` |
| Custom hooks | `frontend/hooks/` |
| API client | `frontend/lib/api.ts` |
| WebSocket client | `frontend/lib/websocket.ts` |
| English translations | `frontend/messages/en.json` |
| Amharic translations | `frontend/messages/am.json` |

### 9.3 Documentation & Business Artifacts

| Claim | Artifact Path |
|-------|---------------|
| 5-part Master Documentation | `docs/master-documentation/MASTER_DOC_PART1_STRATEGY.md` through `MASTER_DOC_PART5_TIMELINE.md` |
| Daily worklogs | `docs/worklog/` |
| ML Evaluation Report | `docs/ThreatMatrix_AI_Day10_Report.md` |
| Advisor Meeting Script | `docs/PRESENTATION_SCRIPT_ADVISOR_MEETING.md` |
| Defense Presentation Script | `docs/DEFENSE_PRESENTATION_SCRIPT.md` |
| Budget Allocation | `docs/Budget_Allocation.md` / `.pdf` |
| Advisor Reschedule Request | `docs/ThreatMatrix_AI_Defense_Reschedule_Request.md` |

---

*End of Document — ThreatMatrix AI Team Roles & Contributions v1.0.0*
