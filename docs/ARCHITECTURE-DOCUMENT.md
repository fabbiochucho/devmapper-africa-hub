# DevMapper Architecture Document
## Version 1.0
### Date: 2026-03-22

---

## Current Architecture (Implemented)

### Frontend
- **Framework:** React (Vite + SWC)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Query (TanStack) + React Context
- **Routing:** React Router v6
- **i18n:** i18next (EN, FR, AR, PT, SW)
- **Maps:** MapLibre GL + Leaflet

### Backend
- **Platform:** Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **Edge Functions:** Deno (TypeScript) for server-side logic
- **Proxies:** gee-proxy, sentinel-proxy, sdg-proxy, climatetrace-proxy, alphaearth-proxy
- **Auth:** Supabase Auth (Email, Google, GitHub, OTP)
- **Payments:** Flutterwave + Paystack (via webhooks)

### Database
- **Primary:** PostgreSQL (Supabase-hosted)
- **RLS:** Row Level Security on all tables
- **Audit:** audit_logs + esg_audit_logs tables

---

## High-Level Architecture

```
Frontend (React + Vite)
   ↓
Supabase Client SDK
   ↓
Supabase Platform
├── PostgreSQL (Core Data)
├── Auth (JWT + Social)
├── Edge Functions (Server Logic)
├── Storage (Files + Media)
└── Realtime (Subscriptions)
   ↓
External APIs (via Edge Function Proxies)
├── Google Earth Engine
├── Sentinel Hub
├── Climate TRACE
├── AlphaEarth
└── UN SDG API
```

---

## Future Microservices Architecture (Aspirational)

When DevMapper scales beyond Supabase, the following microservices architecture is planned:

### Core Services
1. **API Gateway Service** — Entry point, auth, rate limiting, multi-tenant handling
2. **Actor & Core Data Service** — Universal Actor Ontology (UAO), project management
3. **Regulatory Engine Service** — Deterministic compliance logic (NO AI)
4. **REM (Regulatory Exposure Matrix) Service** — Dynamic exposure profiling
5. **Country Intelligence Service** — 54-country regulatory and config logic

### AI Services
6. **AI Orchestration Service** — Agent management, structured prompts, output validation
7. **RAG Service** — Contextual retrieval from regulatory docs, ESG frameworks
8. **LLM Inference Service** — Model provider interface with prompt templates
9. **Multilingual Service** — Language detection + translation

### Infrastructure Services
10. **Notification & Event Service** — Alerts, triggers, automation
11. **Billing & Usage Service** — Subscriptions, quotas, API usage tracking
12. **Audit & Logging Service** — Governance-grade traceability

---

## dMRV Layer (Future)

### Evidence Service
- IoT data ingestion (MQTT/API)
- Satellite data integration (Earth Engine, Sentinel)

### Verification Engine
- Multi-source evidence correlation
- AI cross-checking + rule engine validation
- Confidence scoring

### Audit + Ledger Service
- Start with hashing + audit logs (NOT full blockchain)
- Timestamped records for audit trail
- Add blockchain only if needed later

---

## Carbon Layer (Implemented — PRD V8)

```
Project Workspace Tabs:
├── Overview (existing)
├── Carbon (Phase 1) — Scope 1/2/3 tracking
├── Climate (Phase 2) — Decarbonisation planning
├── Circularity (Phase 2) — Material flows + waste diversion
├── Carbon Assets (Phase 3) — Credit portfolio
├── Compliance (Phase 4) — Article 6/ITMO
└── Financial Impact (Phase 5) — ROI engine
```

### Database Tables (Carbon)
- `project_carbon_data` — Per-project emissions
- `project_decarbonisation` — Reduction strategies
- `project_circularity` — Material flows + circularity scores
- `carbon_assets` — Credit portfolio management
- `carbon_compliance` — Article 6 compliance
- `carbon_transfer_logs` — Ownership transfer history
- `project_financial_impact` — ROI and savings tracking

---

## AI Rules (Strict)

### AI Responsibilities ONLY
- Classification (SDG, sector)
- Summarization
- Data validation hints
- Similar report detection

### AI MUST NOT
- Make final verification decisions
- Replace human verifiers
- Generate fake data
- Act as autonomous agent

### AI Architecture Pattern
- Retrieval Augmented Generation (RAG)
- Prompt templates ONLY (no free-form agents)
- Deterministic outputs where possible

---

## Key Design Principles

1. **dMRV is event-driven:** Evidence triggers verification → scoring → alerts
2. **AI is NOT the source of truth:** AI suggests, Rule Engine validates, Ledger records
3. **Everything links to:** Actor (UAO) → Project → Location → Country
4. **Project-centric architecture:** Everything anchors to the reports table

---

**Document Version:** 1.0
**Last Updated:** 2026-03-22
**Source Documents:** Devmapper_21032026B.txt, Devmapper_21032026C.txt
