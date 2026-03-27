# DevMapper PRD V9 — Comprehensive Platform Roadmap
## Date: 2026-03-27

---

## 1. Executive Summary

DevMapper is Africa's infrastructure for verified impact, ESG accountability, and development intelligence. This PRD consolidates all requirements from V1–V8, strategic documents, and stakeholder feedback into a single comprehensive roadmap.

**AI Branding:** The AI assistant is branded as **Ndovu Akili AI** (Copilot) across all touchpoints.

---

## 2. Completed Features (V1–V8)

### ✅ Core Platform (V1–V3)
- Multi-role authentication (Citizen, NGO, Government, Corporate, Admin)
- SDG-aligned report submission with geo-tagging and evidence upload
- Multi-tier verification system (Self-Report → Community → Partner → Institutional)
- Real-time analytics dashboards per role
- Forum with realtime updates
- Direct messaging system
- Certification workflow (Bronze → Platinum)
- i18n support (EN, FR, AR, PT, SW)

### ✅ ESG & Compliance (V4–V5)
- ESG indicators tracking (Scope 1/2/3, water, waste, energy)
- IFRS S1/S2 readiness assessment
- Supplier emissions management with CSV import
- Regulatory Exposure Matrix (REM) via country_intelligence table
- Compliance assessment per actor type
- ESG scenario analysis

### ✅ AI Layer (V6)
- Ndovu Akili AI with 4 context modes (General, Compliance, Report Draft, Carbon)
- Streaming SSE responses via Lovable AI Gateway
- Persistent conversation history per user
- Quick action presets (World Bank, UNDP, AfDB, GEF report templates)
- Scheduled compliance agent (weekly edge function)

### ✅ Project Management (V7)
- Project lifecycle management (Planned → Active → Completed → Verified)
- Kanban board with task management
- Milestone tracking with verification
- Budget tracker with multi-currency support
- Procurement tracker
- Impact scorecard (DISM engine)
- Donor report export (World Bank, UNDP, AfDB, GEF formats)
- Citizen feedback panel with voting
- Stakeholder affiliation system

### ✅ Carbon Evolution (V8)
- Carbon emissions tracking (Scope 1/2/3)
- Climate risk assessment (TCFD alignment)
- Circularity scoring (waste diversion, material recovery)
- Carbon asset management (credits, offsets, retirement)
- Article 6 compliance tracking (ITMO eligibility)
- Financial impact analysis (carbon pricing, ROI)

### ✅ Platform Infrastructure
- Supabase backend with RLS policies
- PWA with service worker
- Performance optimization (lazy loading, code splitting)
- SEO optimization
- Session timeout management
- Error boundaries
- Notification system (in-app + preferences)
- Admin dashboard with CRM, user management, CMS
- Billing integration (Flutterwave/Paystack webhooks)
- Verification ledger with cryptographic hash-chaining

---

## 3. Remaining Implementation Gaps

### 🔴 Priority 1: Bug Fixes & Stability

| Item | Source | Status |
|------|--------|--------|
| MyProjects "Rendered more hooks" error | Devmapper_20032026-3.txt | Needs investigation |
| Select.Item empty value in ReportStep1 | Devmapper_20032026-3.txt | Needs fix |
| Remaining em-dash scrubbing across platform | Devmapper_22032026.txt | Partially done |

### 🟡 Priority 2: Feature Enhancements

| Feature | Source Document | Description |
|---------|----------------|-------------|
| Impact Credibility Score | Devmapper_1932026-2.txt | Composite score per project: verification level + data completeness + community validation |
| Funding Readiness Indicator | Devmapper_1932026-2.txt | Show which projects are investable vs. need support |
| Risk Flags on Projects | Devmapper_1932026-2.txt | Detect inconsistent data, low verification, dormant projects |
| Decision Dashboard for Funders | Devmapper_1932026-2.txt | Filtered view: "Top Verified Projects Ready for Funding" |
| Badge & Reputation System | Devmapper_21032026B-2.txt | Reporter → Verifier → Trainer progression |
| Social Proof Strategy | Devmapper_21032026B-2.txt | "Be among the first 1,000 reporters" + founding badges |
| Contact form email delivery | Devmapper_22032026.txt | Connect to fabbiochucho@gmail.com + contact@devmapper.africa |

### 🟢 Priority 3: AI-as-a-Service Evolution (Future)

| Feature | Source | Description |
|---------|--------|-------------|
| RAG Pipeline | Devmapper_21032026_AI.txt | Retrieve regulatory docs, ESG frameworks, historical reports |
| Vector Database Integration | Devmapper_21032026_AI.txt | pgvector for embedded knowledge retrieval |
| AI Agent Endpoints | Devmapper_21032026C-2.txt | /ai/generate/compliance-report, /ai/analyze/citizen-issues |
| Multi-Country Regulation Comparison | Devmapper_21032026C-2.txt | Cross-country regulatory analysis API |
| dMRV Integration | Devmapper_21032026C-2.txt | Digital Measurement, Reporting & Verification layer |
| Microservices Architecture | Devmapper_21032026C-2.txt | Future migration from monolith to microservices |

### 🔵 Priority 4: Data & Integrations (Future)

| Integration | Purpose |
|-------------|---------|
| World Bank API | Institutional data backbone |
| IATI (Aid Transparency) | Real-time donor funding data |
| Google Earth Engine | Satellite verification of land use claims |
| African Open Data Portals | Government project and budget data |
| Satellite imagery validation | Independent physical verification |

---

## 4. Ndovu Akili AI — Branding & Architecture

### Brand Identity
- **Name:** Ndovu Akili AI (Copilot)
- **Logo:** Elephant with circuit-board pattern (green/digital aesthetic)
- **Personality:** Authoritative, Africa-context aware, structured, auditable

### Current Capabilities
- Compliance gap analysis across 6+ African regulatory frameworks
- Donor-format report drafting (World Bank, UNDP, AfDB, GEF)
- Carbon footprint estimation and climate risk analysis
- SDG/Agenda 2063 alignment mapping
- Per-user conversation isolation and history persistence

### Future Evolution
- RAG-enhanced responses with regulatory document retrieval
- Structured output via tool calling (compliance scores, risk levels)
- Multi-agent workflows (Compliance Agent, Reporting Agent, Monitoring Agent)
- AI output validation via deterministic Rule Engine
- Multilingual AI output translation

---

## 5. Product Guardrails (Unchanged)

### ❌ NOT Building
- Full project management tool (not Asana)
- Generic social network
- Custom ERP for NGOs
- Blockchain-first product
- Heavy free-form AI chat

### ✅ ARE Building
- Structured reporting + verification system
- Lightweight AI-assisted workflows (Ndovu Akili AI)
- Trust layer for development data
- Scalable API-first infrastructure
- Future-ready: Carbon markets, ESG compliance, Article 6, AI-as-a-Service

---

## 6. Success Metrics

1. **Verified Reports** — total reports reaching Partner/Institutional verification
2. **Verification Rate (%)** — % of submitted reports that get verified
3. **Org Subscriptions** — paying organization accounts
4. **Cost per Verified Data Point** — operational efficiency
5. **Time to Verification** — speed of verification workflow
6. **Retention** — monthly active reporters + organizations
7. **AI Utilization** — Ndovu Akili AI sessions per active user
8. **ESG Report Generation** — audit-ready reports exported

---

## 7. Implementation Priority (Next Sprint)

### Sprint 1: Stability & Bugs
- Fix MyProjects hooks error
- Fix ReportStep1 Select.Item error
- Complete remaining dash-to-comma text fixes

### Sprint 2: Credibility Features
- Impact Credibility Score per project
- Funding Readiness Indicator
- Risk flag detection

### Sprint 3: Social Proof & Growth
- Badge/reputation system
- "First 1,000" social proof on landing page
- Contact form email integration

### Sprint 4: AI Enhancement
- RAG pipeline with pgvector
- Structured output via tool calling
- AI output audit logging

---

**Document Version:** 9.0
**Last Updated:** 2026-03-27
**Consolidates:** V1–V8 PRDs + all uploaded strategic documents
