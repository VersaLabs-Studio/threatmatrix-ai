# ThreatMatrix AI

**Enterprise‑grade AI‑powered network anomaly detection and cyber threat intelligence platform**

---

## Table of Contents

1. [Project Overview & Context](#project-overview--context)
2. [Features](#features)
3. [Architecture Overview](#architecture-overview)
4. [Modules & UI Features](#modules--ui-features)
5. [Machine Learning & LLM Integration](#machine-learning--llm-integration)
6. [Development Timeline, Workflow & Getting Started](#development-timeline-workflow--getting-started)
7. [Installation](#installation)
8. [Testing Strategy](#testing-strategy)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Technology Stack](#technology-stack)
11. [Live Deployments](#live-deployments)
12. [Repository & Source Code](#repository)
13. [Architecture Decision Records (ADR) – DDD Focus](#architecture-decision-records-adr---ddd-focus)
14. [Roadmap](#roadmap)
15. [Contributing](#contributing)
16. [Changelog](#changelog)
17. [License](#license)
18. [Contact & Support](#contact--support)
19. [Glossary](#glossary)

---

## Project Overview & Context

**ThreatMatrix AI** is a **proprietary, enterprise‑grade** cyber‑security platform built by **VersaLabs**.  It delivers **real‑time network anomaly detection**, **automated threat‑intel enrichment**, and a **war‑room style command‑center UI** that mimics the look‑and‑feel of a national intelligence agency operations centre.

The platform is purpose‑built for the **Ethiopian digital transformation** (Digital Ethiopia 2025) – a market where rapid digitisation has outpaced local security tooling.  By providing a locally‑hosted, cost‑effective alternative to expensive global SIEM solutions, ThreatMatrix AI targets:

* **Government agencies** (INSA, Ministry of Innovation & Technology)
* **Financial institutions** (Commercial Bank of Ethiopia, Dashen Bank, etc.)
* **Telecom operators** (Ethio Telecom, Safaricom Ethiopia)
* **Enterprises & SMEs** that need a scalable, affordable security stack

While the primary market is Ethiopia, the architecture is **cloud‑agnostic** and can be deployed in any enterprise environment worldwide.

---

## Architecture Overview

The full architectural description lives in the master documentation:

* **Part 2 – System Architecture & Infrastructure Blueprint** – [`docs/master-documentation/MASTER_DOC_PART2_ARCHITECTURE.md`](docs/master-documentation/MASTER_DOC_PART2_ARCHITECTURE.md)

### High‑Level Three‑Tier Design

1. **Capture Engine** – Python/Scapy service that sniffs live traffic on a VPS, aggregates flows, extracts **40+ features** per flow and publishes them via **Redis Pub/Sub**.
2. **Intelligence Engine** – FastAPI backend that performs **ML inference**, correlates **threat‑intel feeds**, orchestrates **LLM narratives**, and exposes a **REST + WebSocket API**.
3. **Command Center** – Next.js 16 (TypeScript) UI hosted on **Vercel**, rendering real‑time maps, dashboards, and an **AI Analyst** chat.

### Domain‑Driven Design (DDD) Contexts

| Bounded Context | Primary Responsibility | Key Entities |
|-----------------|------------------------|--------------|
| **Capture** | Ingest raw packets, produce flow records | `NetworkFlow`, `CaptureSession` |
| **Intelligence** | Apply ML models, enrich with intel, generate alerts | `Alert`, `MLModel`, `ThreatIntelIOC` |
| **Interaction** | UI rendering, user actions, LLM conversations | `User`, `LLMConversation`, `Report` |

Each context owns its own data model and persistence strategy, communicating only through well‑defined **domain events** (e.g., `FlowAnalyzed`, `AlertCreated`).  This separation enforces clear boundaries, simplifies testing, and enables independent scaling of each tier.

---

## Modules & UI Features

All UI modules are documented in **Part 3 – Module Specifications & UI/UX Design System**:

[`docs/master-documentation/MASTER_DOC_PART3_MODULES.md`](docs/master-documentation/MASTER_DOC_PART3_MODULES.md)

### Core Modules

| Module | Route | Primary Function |
|--------|-------|------------------|
| **War Room** | `/war-room` | Real‑time threat map, metric cards, live alert ticker |
| **Threat Hunt** | `/hunt` | Visual query builder for forensic investigations |
| **Intel Hub** | `/intel` | IOC browser, IP reputation lookup, feed health dashboard |
| **AI Analyst** | `/ai-analyst` | Conversational LLM interface for threat analysis, briefing, translation |
| **Alert Console** | `/alerts` | Alert lifecycle management, bulk actions, severity filtering |
| **Forensics Lab** | `/forensics` | PCAP upload, packet inspection, flow reconstruction |
| **ML Operations** | `/ml-ops` | Model registry, performance dashboards, retraining controls |
| **Reports** | `/reports` | PDF generation (daily briefings, incident reports, executive summaries) |
| **Administration** | `/admin` | User & role management, system config, LLM budget monitoring |

Each module follows the **Design System** defined in Part 3 (glass‑morphism panels, cyber‑themed colour palette, responsive layout) and is built with reusable React components (`GlassPanel`, `MetricCard`, `DataTable`, etc.).

---

## Machine Learning & LLM Integration

The ML pipeline and LLM strategy are described in **Part 4**:

[`docs/master-documentation/MASTER_DOC_PART4_ML_LLM.md`](docs/master-documentation/MASTER_DOC_PART4_ML_LLM.md)

### Core ML Components

| Model | Paradigm | Primary Role |
|-------|----------|--------------|
| **Isolation Forest** | Unsupervised anomaly detector | Zero‑day detection (sentinel) |
| **Random Forest** | Supervised multi‑class classifier | Primary attack classification |
| **Autoencoder** | Deep learning reconstruction | Subtle pattern detection |

All three models run in parallel on each flow; their scores are combined by a **weighted ensemble scorer** (see Part 4) to produce a composite anomaly score and final label.

### LLM Gateway (OpenRouter)

* **Nemotron‑Ultra 253B** – Complex analysis & narrative generation (free tier).
* **Step 3.5 Flash** – Real‑time alert summarisation (fastest MoE).
* **GPT‑OSS 120B** – General‑purpose chat and investigation.
* **GLM‑4.1v** – Bilingual (Amharic/English) translation and bulk tasks.

The gateway implements **budget tracking**, **response caching**, **rate‑limiting**, and **fallback routing** to ensure zero‑cost operation for the demo while preserving the ability to switch to premium providers if needed.

### Real‑Time Inference Pipeline

1. Capture Engine publishes a flow to `flows:live` (Redis).
2. **ML Worker** subscribes, normalises the feature vector, runs the three models, computes the ensemble score.
3. If the composite score exceeds a configurable threshold, an **Alert** is persisted and published to `alerts:live`.
4. The **LLM Gateway** may be invoked asynchronously to generate a natural‑language narrative for the alert.
5. Front‑end WebSocket clients receive the alert in < 200 ms total latency.

---

## Development Timeline, Workflow & Getting Started

The eight‑week sprint plan and detailed task matrix are captured in **Part 5**:

[`docs/master-documentation/MASTER_DOC_PART5_TIMELINE.md`](docs/master-documentation/MASTER_DOC_PART5_TIMELINE.md)

### Quick‑Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/VersaLabs-Studio/threatmatrix-ai.git
cd threatmatrix-ai

# Backend (Python) – create virtualenv and install deps
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# Frontend (Node) – install deps
cd frontend && npm install

# Start infrastructure (Postgres + Redis) – Docker Compose (dev)
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Run DB migrations
cd ../backend && alembic upgrade head

# Start backend API (auto‑reload)
uvicorn app.main:app --reload --port 8000

# In another terminal, start the Next.js dev server
cd ../frontend && npm run dev

# Access the UI at http://localhost:3000 and the API docs at http://localhost:8000/docs
```

The **weekly demo rule** (every Sunday) ensures the system is always in a demonstrable state.

---

## Technology Stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| **Frontend** | Next.js | 16.x (SSR/SSG) |
| | TypeScript | 5.x (strict) |
| | Styling | CSS variables + vanilla CSS (glass‑morphism) |
| | Maps & Visualisation | Deck.gl, Maplibre GL, Recharts |
| **Backend** | FastAPI | 0.110+ (async, OpenAPI) |
| | Python | 3.11+ |
| | Database | PostgreSQL 16 (JSONB, INET) |
| | Cache / Pub‑Sub | Redis 7 (Pub/Sub, rate‑limit) |
| | ML Libraries | scikit‑learn, TensorFlow/Keras |
| | Packet Capture | Scapy 2.5+ |
| **LLM** | OpenRouter (Unified API) | Free‑tier models (Nemotron‑Ultra 253B, Step 3.5 Flash, GPT‑OSS 120B, GLM‑4.1v) |
| **Infrastructure** | Docker Compose (v2) | Multi‑service orchestration |
| | Nginx | Reverse‑proxy, TLS (Let’s Encrypt) |
| | Vercel | Front‑end hosting (HTTPS, edge network) |
| **CI / DevOps** | GitHub Actions (optional) | Lint, test, build |
---

## Live Deployments

| Component | URL |
|-----------|-----|
| **Frontend (Command Center)** | <https://threatmatrix-ai.vercel.app> |
| **Backend API** | <https://api.threatmatrix-ai.com> |

Both endpoints are secured with **JWT authentication** and enforce **role‑based access control** (admin, SOC manager, analyst, viewer).

---

## Repository

The source code is hosted on GitHub under the VersaLabs organization:

**GitHub URL:** <https://github.com/VersaLabs-Studio/threatmatrix-ai>

The repository follows a **monorepo** layout with separate `backend/` and `frontend/` directories, a `docs/` folder for the master documentation, and Docker‑Compose files for local development and production.

---

## Architecture Decision Records (ADR) – DDD Focus

The following table summarises the **key architectural decisions** that were made with a **Domain‑Driven Design** mindset.  Full ADR documents live in `docs/adr/` (not shown here).

| ADR | Decision | DDD Rationale |
|-----|----------|---------------|
| **ADR‑001** | Adopt **Domain‑Driven Design** as the core modelling approach. | Establishes a **Ubiquitous Language** across Capture, Intelligence, and Interaction contexts, ensuring that domain experts and engineers speak the same terms. |
| **ADR‑002** | Define three **Bounded Contexts**: Capture, Intelligence, Interaction. | Each context owns its own model (`NetworkFlow`, `Alert`, `User`), persistence, and invariants, reducing coupling and enabling independent evolution. |
| **ADR‑003** | Use **Event‑Driven Communication** (Redis Pub/Sub) for cross‑context events (`FlowAnalyzed`, `AlertCreated`). | Guarantees **eventual consistency** while keeping contexts decoupled; events become the lingua franca of the domain. |
| **ADR‑004** | Choose **FastAPI** for the Intelligence Engine. | Provides a **clean, contract‑first API** (OpenAPI) that mirrors the domain services (`MLService`, `IntelService`, `LLMService`). |
| **ADR‑005** | Choose **Next.js 16** with TypeScript for the Interaction layer. | Enables a **type‑safe UI** that directly reflects domain models (`AlertDTO`, `FlowDTO`), reducing translation errors. |
| **ADR‑006** | Store core aggregates in **PostgreSQL** with JSONB for flexible extensions. | Allows **rich domain objects** (e.g., `Alert` with embedded `LLM Narrative`) while preserving relational integrity. |
| **ADR‑007** | Implement **LLM Gateway** as a domain service that enriches alerts. | Treats LLM calls as **application services** that augment the domain (adding `ai_narrative` to `Alert`). |
| **ADR‑008** | Use **Docker Compose** for deployment. | Keeps the **infrastructure model** simple and aligned with the bounded contexts (one container per context). |
| **ADR‑009** | Enforce **JWT‑based RBAC** with four roles. | Encapsulates **access control** as a domain policy, ensuring that only authorised actors can mutate certain aggregates. |
| **ADR‑010** | Deploy an **ensemble of three ML models**. | Each model represents a **different sub‑domain** of anomaly detection (unsupervised, supervised, deep learning), providing a richer domain insight. |
| **ADR‑011** | Introduce **AI Analyst** chat as a first‑class UI component. | Elevates the LLM from a utility to a **domain‑level collaborator**, enabling analysts to query the system in natural language. |

These decisions collectively embody the DDD philosophy: the **domain model drives the data schema, service boundaries, and UI contracts**, while technical concerns (containers, databases, frameworks) are chosen to support those domain invariants.

---

## License

This project is released under the **MIT License** – see the `LICENSE` file for details.

---

## Contact & Support

**VersaLabs – Enterprise Security Division**

* Website: https://versalabs.com
* Email: security@versalabs.com
* GitHub: https://github.com/VersaLabs-Studio
* Slack (internal): `#threatmatrix-ai` (for VersaLabs staff)

---

*© 2026 VersaLabs. All rights reserved.*
