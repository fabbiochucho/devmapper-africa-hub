# DevMapper PRD V9.1 — Comprehensive Platform Roadmap
## Date: 2026-04-02

---

## 1. Executive Summary

DevMapper is Africa's Carbon Economy Operating System — not just a reporting tool. It connects data to trust, trust to capital, and capital to measurable impact across 54 African countries.

**AI Branding:** The AI assistant is branded as **Ndovu Akili AI** (Copilot) across all touchpoints.

**Strategic Positioning:** "Track Goals. Verify Impact. Unlock Funding. Build Trust."

---

## 2. Platform Pillars (6 Core)

1. **Verification & Trust Layer** — Multi-tier verification, audit trails, reputation system
2. **Carbon Project Marketplace** — Project discovery, credit lifecycle, portfolio builder
3. **Ndovu Akili AI (Copilot)** — Multi-agent AI across all workflows
4. **Multi-Stakeholder Ecosystem** — Role-based dashboards, cross-entity workflows
5. **Integration Layer** — ERP connectors, satellite data, emission factor tables
6. **ESG & Compliance System of Record** — GRI/CDP/ISSB/SBTi/CSRD alignment

---

## 3. Comprehensive Feature Plan Table

### Legend
- ✅ **Built** — Implemented and functional
- 🟡 **Partial** — Started but incomplete
- ❌ **Not Built** — Not yet implemented
- 🔮 **Future** — Planned for later phase

---

### 3.1 Core Platform (V1–V3)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Multi-role authentication (Citizen, NGO, Gov, Corporate, Admin) | ✅ Built | AuthContext + role switcher |
| 2 | SDG-aligned report submission with geo-tagging | ✅ Built | SubmitReport + ReportStep1/2 |
| 3 | Multi-tier verification (Self → Community → Partner → Institutional) | ✅ Built | VerificationPanel + SPVF engine |
| 4 | Real-time analytics dashboards per role | ✅ Built | UnifiedDashboard + role-specific pages |
| 5 | Forum with realtime updates | ✅ Built | Forum + RealtimeForumUpdates |
| 6 | Direct messaging system | ✅ Built | Messages + ConversationList + MessageThread |
| 7 | Certification workflow (Bronze → Platinum) | ✅ Built | CertificationWorkflow + ApplyCertification |
| 8 | i18n support (EN, FR, AR, PT, SW) | ✅ Built | i18next with 5 locale files |
| 9 | Evidence upload (photos, documents, geotagged media) | ✅ Built | FileUpload + evidence_items table |
| 10 | PWA with service worker | ✅ Built | sw.js + PWAInstallPrompt |

### 3.2 ESG & Compliance (V4–V5)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11 | ESG indicators tracking (Scope 1/2/3, water, waste, energy) | ✅ Built | ESGDashboard + esg_indicators table |
| 12 | IFRS S1/S2 readiness assessment | ✅ Built | IFRSReadinessAssessment component |
| 13 | Supplier emissions management with CSV import | ✅ Built | SupplierCSVImporter + ManualSupplierEntry |
| 14 | Regulatory Exposure Matrix (country_intelligence) | ✅ Built | Table populated, ComplianceAssessment uses it |
| 15 | Compliance assessment per actor type | ✅ Built | ComplianceAssessment component |
| 16 | ESG scenario analysis | ✅ Built | ESGScenarioAnalysis component |
| 17 | ESG data verification workflow | ✅ Built | ESGDataVerification component |
| 18 | ESG report generation (PDF export) | ✅ Built | ESGReportGenerator + ESGReportDialog |
| 19 | GRI native indicator mapping (metric_key → GRI codes) | ❌ Not Built | Needs frameworks + indicators tables + seed data |
| 20 | CDP framework alignment | ❌ Not Built | Template exists in AI prompts but no structured mapping |
| 21 | CSRD compliance module | ❌ Not Built | Referenced in docs, not implemented |
| 22 | SBTi target validation | ❌ Not Built | No SBTi-specific validation logic |
| 23 | Compliance dashboard with visual gap analysis | 🟡 Partial | ComplianceAssessment exists but no visual gap chart |
| 24 | Auto-generated ESG reports from esg_metrics | 🟡 Partial | Report dialog exists but doesn't auto-pull all metrics |

### 3.3 AI Layer — Ndovu Akili AI (V6 + Ndovu Prompt Library)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 25 | Ndovu Akili AI with 4 context modes | ✅ Built | AICopilot with General/Compliance/Report/Carbon |
| 26 | Streaming SSE responses | ✅ Built | Via Lovable AI Gateway |
| 27 | Persistent conversation history | ✅ Built | ai_conversations table |
| 28 | Quick action presets (WB, UNDP, AfDB, GEF) | ✅ Built | AICopilotQuickActions |
| 29 | Scheduled compliance agent | ✅ Built | compliance-check edge function |
| 30 | **Emissions Analysis prompts** | ❌ Not Built | Prompt library defined but not wired to UI context |
| 31 | **Emissions Gap Detection prompts** | ❌ Not Built | " |
| 32 | **Project Credibility Check prompts** | ❌ Not Built | " |
| 33 | **Verification Assistant prompts** | ❌ Not Built | " |
| 34 | **Satellite Validation prompts** | ❌ Not Built | " |
| 35 | **Carbon Credit Recommendation prompts** | ❌ Not Built | " |
| 36 | **Portfolio Builder AI prompts** | ❌ Not Built | " |
| 37 | **ROI Analysis prompts** | ❌ Not Built | " |
| 38 | **Net-Zero Roadmap prompts** | ❌ Not Built | " |
| 39 | **Supplier Engagement Strategy prompts** | ❌ Not Built | " |
| 40 | **Regulatory Alert Generator prompts** | ❌ Not Built | " |
| 41 | **Government Review prompts** | ❌ Not Built | " |
| 42 | **Investor Due Diligence prompts** | ❌ Not Built | " |
| 43 | **Guided Workflow prompts** | ❌ Not Built | " |
| 44 | **Expert/Beginner mode toggle** | ❌ Not Built | " |

### 3.4 Multi-Agent AI Architecture (Ndovu Agents)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 45 | Orchestrator (intent routing to agents) | ❌ Not Built | Single AI endpoint today, no routing |
| 46 | **Verifier AI** (trust engine, greenwashing detection) | ❌ Not Built | Needs agent with project data context |
| 47 | **Investor AI** (ROI, payback, portfolio fit) | ❌ Not Built | Needs financial data context |
| 48 | **Regulator AI** (GRI/CDP/CSRD gap analysis) | ❌ Not Built | Needs framework mapping context |
| 49 | **Project Developer AI** (step-by-step project design) | ❌ Not Built | |
| 50 | **Supplier AI** (Scope 3 completeness scoring) | ❌ Not Built | |
| 51 | **Carbon Trader AI** (buy/sell timing, retirement) | ❌ Not Built | |
| 52 | Multi-agent synthesis output format | ❌ Not Built | Summary → Insights → Risks → Actions |
| 53 | RAG pipeline with pgvector | 🔮 Future | Architectural plan exists |
| 54 | AI output audit logging | ❌ Not Built | Conversations saved but no structured audit |

### 3.5 Project Management (V7)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 55 | Project lifecycle (Planned → Active → Completed → Verified) | ✅ Built | ProjectLifecycleManager |
| 56 | Kanban board with tasks | ✅ Built | KanbanBoard component |
| 57 | Milestone tracking with verification | ✅ Built | ProjectMilestones + AddMilestoneDialog |
| 58 | Budget tracker with multi-currency | ✅ Built | BudgetTracker component |
| 59 | Procurement tracker | ✅ Built | ProcurementTracker component |
| 60 | Impact scorecard (DISM engine) | ✅ Built | ImpactScorecard + dism-engine.ts |
| 61 | Donor report export (WB, UNDP, AfDB, GEF) | ✅ Built | DonorReportExport component |
| 62 | Citizen feedback panel with voting | ✅ Built | CitizenFeedbackPanel + feedback_votes |
| 63 | Stakeholder affiliation system | ✅ Built | StakeholderAffiliation component |

### 3.6 Carbon Evolution (V8)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 64 | Carbon emissions tracking (Scope 1/2/3) | ✅ Built | CarbonTab + ClimateTab |
| 65 | Climate risk assessment (TCFD) | ✅ Built | ClimateTab component |
| 66 | Circularity scoring | ✅ Built | CircularityTab component |
| 67 | Carbon asset management | ✅ Built | CarbonAssetsTab + carbon_assets table |
| 68 | Article 6 compliance (ITMO) | ✅ Built | ComplianceTab component |
| 69 | Financial impact analysis | ✅ Built | FinancialImpactTab component |

### 3.7 Verification & Trust Layer (New — Pillar 1)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 70 | Verification ledger with hash-chaining | ✅ Built | verification-ledger.ts |
| 71 | Multi-stage verification workflow | ✅ Built | VerificationPanel + SPVFVerificationPanel |
| 72 | Exportable audit trails (PDF/JSON) | 🟡 Partial | Ledger view exists but no export button |
| 73 | **Verifier Marketplace** (auditors, field agents) | ❌ Not Built | No verifier profiles or assignment system |
| 74 | **Verifier reputation system** (scoring, leaderboard) | ❌ Not Built | |
| 75 | **Auto-assign verifier workflow** | ❌ Not Built | |
| 76 | **Proof-of-impact system** (satellite + geotagged evidence linked) | 🟡 Partial | Evidence upload exists but no satellite linking |
| 77 | **Immutable audit trail export** for regulators | 🟡 Partial | Hash-chain exists, no regulator export format |

### 3.8 Carbon Marketplace (New — Pillar 2)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 78 | **Project listing system** (rich metadata, verification badge) | ❌ Not Built | No marketplace UI |
| 79 | **Buyer interface** (filter by SDG, geography, certification) | ❌ Not Built | |
| 80 | **Portfolio builder** (diversified carbon portfolios) | ❌ Not Built | |
| 81 | **Credit lifecycle tracking** (issuance → listing → purchase → retirement) | 🟡 Partial | carbon_assets tracks credits but no marketplace flow |
| 82 | **Smart pricing** (AI-driven pricing suggestions) | ❌ Not Built | |
| 83 | **Carbon credit purchase/retirement flow** | ❌ Not Built | |

### 3.9 Multi-Stakeholder Ecosystem (New — Pillar 4)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 84 | Role-based dashboards | ✅ Built | Corporate/Government/NGO/Citizen dashboards |
| 85 | Cross-entity workflows (Corporate funds → Verifier validates → Gov reviews) | ❌ Not Built | Roles exist in silos |
| 86 | **Shared workspaces** (invite stakeholders to project) | ❌ Not Built | |
| 87 | **Task assignments** ("Upload evidence", "Review methodology") | 🟡 Partial | Kanban has tasks but no cross-org assignment |
| 88 | **Data exchange layer** (secure sharing of emissions/project data) | ❌ Not Built | |

### 3.10 Integration Layer (New — Pillar 5)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 89 | Google Earth Engine proxy | ✅ Built | gee-proxy edge function |
| 90 | Climate TRACE proxy | ✅ Built | climatetrace-proxy edge function |
| 91 | Exchange rates API | ✅ Built | exchange-rates edge function |
| 92 | **ERP connector UI** (Odoo/SAP credential entry + sync) | ❌ Not Built | Design exists in Ndovu doc |
| 93 | **ERP sync backend** (normalize ERP data → supplier_emissions) | ❌ Not Built | " |
| 94 | **Local emission factor tables** (seeded from Climatiq/national DBs) | ❌ Not Built | |
| 95 | **World Bank API integration** | 🔮 Future | |
| 96 | **IATI (Aid Transparency) integration** | 🔮 Future | |
| 97 | **Satellite imagery auto-validation** | 🔮 Future | GEE proxy exists but no auto-correlation |

### 3.11 Platform Infrastructure & UX

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 98 | Supabase backend with RLS | ✅ Built | |
| 99 | SEO optimization | ✅ Built | SEOHead component |
| 100 | Error boundaries | ✅ Built | ErrorBoundary component |
| 101 | Notification system | ✅ Built | NotificationSystem + preferences |
| 102 | Admin dashboard (CRM, users, CMS) | ✅ Built | AdminDashboard + sub-components |
| 103 | Billing (Flutterwave/Paystack webhooks) | ✅ Built | Edge functions exist |
| 104 | Session timeout management | ✅ Built | SessionTimeoutWarning |
| 105 | Performance optimization (lazy loading, code splitting) | ✅ Built | PerformanceOptimizer |
| 106 | Mobile bottom nav | ✅ Built | MobileBottomNav |
| 107 | Onboarding wizard | ✅ Built | OnboardingWizard |
| 108 | Product walkthrough | ✅ Built | ProductWalkthrough |
| 109 | Global search | ✅ Built | GlobalSearch + SearchInterface |
| 110 | PWA offline data support | ❌ Not Built | SW caches shell only |
| 111 | **Impact Credibility Score** per project | ❌ Not Built | |
| 112 | **Funding Readiness Indicator** | ❌ Not Built | |
| 113 | **Risk Flags** on projects | ❌ Not Built | |
| 114 | **Decision Dashboard for Funders** | ❌ Not Built | |
| 115 | **Badge & Reputation System** (Reporter → Verifier → Trainer) | ❌ Not Built | |
| 116 | **Social Proof** ("First 1,000 reporters") | ❌ Not Built | |
| 117 | **Contact form email delivery** | ❌ Not Built | |

---

## 4. Ndovu Akili AI — Architecture & Prompt Library

### 4.1 Brand Identity
- **Name:** Ndovu Akili AI (Copilot)
- **Logo:** Elephant with circuit-board pattern (green/digital aesthetic)
- **Personality:** Precise, structured, actionable, Africa-context aware

### 4.2 System Prompt (Global)
The base system prompt defines Ndovu as a carbon economy copilot that helps users measure emissions, validate projects, make decarbonization decisions, navigate carbon markets, and ensure ESG compliance. Output format: Summary → Key Insights → Risks → Recommended Actions.

### 4.3 Prompt Library (8 Categories)
1. **Emissions & Reporting** — Analysis, gap detection, ESG report generation
2. **Project Verification** — Credibility check, verification assistant, satellite validation
3. **Marketplace & Investment** — Credit recommendation, portfolio builder, ROI analysis
4. **Decarbonization Strategy** — Net-zero roadmap, reduction optimizer, supplier engagement
5. **Compliance & Risk** — Gap analysis (CSRD/ISSB/CDP), regulatory alerts
6. **Multi-Stakeholder** — Government review, investor due diligence
7. **Conversational/UX** — General assistant, guided workflows
8. **Meta** — Beginner mode, expert mode

### 4.4 Multi-Agent Architecture
- **Orchestrator:** Routes user intent to specialized agents, synthesizes responses
- **Verifier AI:** Trust engine — credibility scores, greenwashing detection
- **Investor AI:** Value engine — ROI, payback period, portfolio fit
- **Regulator AI:** Compliance engine — GRI/CDP/CSRD/SBTi gap analysis
- **Project Developer AI:** Step-by-step project design checklists
- **Supplier AI:** Scope 3 completeness scoring
- **Carbon Trader AI:** Buy/sell timing, retirement planning

All agents read from DevMapper's PostgreSQL schema only — no external dependencies.

---

## 5. Product Guardrails

### ❌ NOT Building
- Full project management tool (not Asana)
- Generic social network
- Custom ERP for NGOs
- Blockchain-first product
- Heavy free-form AI chat
- External carbon calculation engine (use local emission factors)
- Complex enterprise ERP integrations (early stage)
- Western compliance over African usability

### ✅ ARE Building
- Structured reporting + multi-tier verification system
- Lightweight AI-assisted workflows (Ndovu Akili AI)
- Trust layer for development data (hash-chain ledger)
- Carbon marketplace (Africa-first)
- ERP pull-based connectors (Odoo/SAP, user-triggered)
- IFRS S1/S2 + GRI + CDP compliance engine
- Multi-agent AI (Verifier, Investor, Regulator)
- Scalable API-first infrastructure

---

## 6. Success Metrics

### Primary
1. **Verified Reports** — total reaching Partner/Institutional verification
2. **Verification Rate (%)** — % of submitted reports verified
3. **Org Subscriptions** — paying organization accounts
4. **Time to Verification** — avg days from submission to verified

### Secondary
5. **Cost per Verified Data Point** — operational efficiency
6. **Reporter Retention** — monthly active reporters (30-day)
7. **AI Utilization** — Ndovu Akili AI sessions per active user
8. **ESG Reports Generated** — audit-ready reports exported
9. **Carbon Credits Tracked** — total tCO2e managed
10. **Country Coverage** — active projects across African countries

---

## 7. Implementation Roadmap

### Phase 1: AI Prompt Wiring (Current Sprint)
- Wire Ndovu Akili prompt library to UI context (emissions, verification, marketplace)
- Add context-aware quick actions per page
- Implement structured output format (Summary/Insights/Risks/Actions)

### Phase 2: Verification & Trust Enhancement
- Verifier marketplace (profiles, credentials, region, expertise)
- Auto-assign verifier workflow
- Verifier reputation scoring + leaderboard
- Exportable audit trails (PDF/JSON for regulators)

### Phase 3: Carbon Marketplace MVP
- Project listing system with rich metadata
- Buyer interface with filters (SDG, geography, certification)
- Credit lifecycle (issuance → listing → purchase → retirement)
- Portfolio builder (diversified carbon portfolios)

### Phase 4: Multi-Agent AI
- Orchestrator with intent routing
- Verifier AI agent (greenwashing detection)
- Investor AI agent (ROI analysis)
- Regulator AI agent (framework gap analysis)
- Multi-agent synthesis output

### Phase 5: Integration & Intelligence
- GRI indicator mapping (frameworks + indicators tables)
- Local emission factor tables
- ERP connector UI + backend (Odoo/SAP)
- Impact Credibility Score + Funding Readiness Indicator
- Risk flags on projects

### Phase 6: Future (Post-MVP)
- RAG pipeline with pgvector
- dMRV satellite auto-correlation
- Shared workspaces + cross-org task assignment
- Smart AI pricing for carbon credits
- Mobile app (PWA enhancement or React Native)

---

## 8. Summary Statistics

| Category | Total Features | ✅ Built | 🟡 Partial | ❌ Not Built | 🔮 Future |
|----------|---------------|----------|-----------|-------------|----------|
| Core Platform (V1-V3) | 10 | 10 | 0 | 0 | 0 |
| ESG & Compliance (V4-V5) | 14 | 10 | 2 | 2 | 0 |
| AI Layer (V6 + Prompts) | 20 | 5 | 0 | 15 | 0 |
| Multi-Agent Architecture | 10 | 0 | 0 | 9 | 1 |
| Project Management (V7) | 9 | 9 | 0 | 0 | 0 |
| Carbon Evolution (V8) | 6 | 6 | 0 | 0 | 0 |
| Verification & Trust | 8 | 2 | 3 | 3 | 0 |
| Carbon Marketplace | 6 | 0 | 1 | 5 | 0 |
| Multi-Stakeholder | 5 | 1 | 1 | 3 | 0 |
| Integration Layer | 9 | 3 | 0 | 3 | 3 |
| Platform & UX | 20 | 12 | 0 | 7 | 1 |
| **TOTAL** | **117** | **58** | **7** | **47** | **5** |

**Completion: 50% built, 6% partial, 40% not built, 4% future**

---

**Document Version:** 9.1
**Last Updated:** 2026-04-02
**Sources:** V1–V8 PRDs + Devmapper_Ndovu.txt + DevMapper_02042026-2.txt + all strategic documents
