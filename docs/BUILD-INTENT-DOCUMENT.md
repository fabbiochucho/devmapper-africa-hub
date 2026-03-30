# DevMapper Build Intent Document
## Version 2.0 — Comprehensive
### Date: 2026-03-30

---

## Core Vision

DevMapper becomes Africa's default infrastructure for tracking, verifying, and monetizing development impact.

- Not a dashboard.
- Not a reporting tool.
- **A system of record + intelligence layer for development activity across 54 African countries.**
- The bridge between grassroots impact and institutional capital.

---

## Strategic Positioning

**Tagline:** "Track Goals. Verify Impact. Unlock Funding. Build Trust."

**4-Step Process:**
1. **Capture** - Structured data intake (reports, evidence, geo-tagged media)
2. **Verify** - Multi-tier stakeholder validation (Self → Community → Partner → Institutional)
3. **Score** - Impact/credibility scoring via DISM engine + SPVF framework
4. **Act** - Decision-ready intelligence for funders, governments, corporates

---

## Core User Personas

### 1. Citizen Reporter (Grassroots)
- **Who:** Individual volunteers, community leaders, activists
- **Needs:** Easy reporting, recognition, certification progression
- **Value:** Public recognition + certification (Bronze → Platinum)
- **Key Workflows:** Submit reports, track own submissions, receive feedback, earn badges
- **Monetization:** Free tier with upgrade prompts

### 2. NGO / Civil Society
- **Who:** NGOs, CBOs, faith-based organizations, project implementers
- **Needs:** Structured donor reporting, verification credibility, fundraising tools
- **Value:** Audit-ready reports (World Bank, UNDP, AfDB, GEF formats), verification workflows
- **Key Workflows:** Submit projects, manage milestones, generate donor reports, track verification pipeline
- **Monetization:** Pro/Advanced subscriptions

### 3. Corporate / Private Sector
- **Who:** ESG officers, sustainability teams, CSR departments
- **Needs:** IFRS S1/S2 compliance, Scope 1/2/3 tracking, supplier emissions, ESG scoring
- **Value:** Regulatory compliance + carbon market readiness + stakeholder reporting
- **Key Workflows:** ESG dashboard, emissions management, scenario analysis, IFRS readiness assessment
- **Monetization:** Advanced/Enterprise subscriptions

### 4. Government
- **Who:** SDG focal points, planning ministries, local government, M&E units
- **Needs:** National SDG tracking, budget alignment, citizen feedback loops
- **Value:** Real-time visibility into development projects across administrative areas
- **Key Workflows:** SDG heatmap, budget analytics, project oversight, citizen feedback aggregation
- **Monetization:** Enterprise/Government tiers

### 5. Verifier (Expert Layer)
- **Who:** Academics, auditors, consultants, partner organizations
- **Needs:** Trust system, verification workflow tools, incentives
- **Value:** Reputation building + verification fee income
- **Key Workflows:** Review submissions, approve/reject evidence, provide verification notes
- **Monetization:** Verification-as-a-Service fees

### 6. Ecosystem Players (Future Monetization)
- **Who:** Carbon developers, climate funds, Article 6 traders, DFIs, impact investors
- **Needs:** Verified ground-truth data, carbon credit pipeline, ITMO compliance
- **Value:** Investable project pipeline + verified carbon assets
- **Key Workflows:** Browse verified projects, assess funding readiness, carbon credit marketplace
- **Monetization:** Transaction fees on carbon credits, premium data access

---

## Core Value Proposition by Persona

| User | Value Delivered |
|------|----------------|
| Citizens | Recognition + certification + public impact profile |
| NGOs | Structured reporting + donor-format exports + fundraising |
| Corporates | ESG compliance (IFRS S1/S2) + carbon tracking + scenario analysis |
| Governments | National SDG tracking + budget analytics + citizen feedback |
| Verifiers | Reputation system + verification workflow + fee income |
| Carbon players | Verified ground data + Article 6 compliance + credit portfolio |

---

## Success Metrics (North Star)

### Primary Metrics
1. **Verified Reports** - Total reports reaching Partner/Institutional verification
2. **Verification Rate (%)** - % of submitted reports that achieve verification
3. **Org Subscriptions** - Paying organization accounts (monthly/annual)
4. **Time to Verification** - Average days from submission to verified status

### Secondary Metrics
5. **Cost per Verified Data Point** - Operational efficiency measure
6. **Reporter Retention** - Monthly active reporters (30-day)
7. **Org Retention** - Monthly active organizations (30-day)
8. **AI Utilization** - Ndovu Akili AI sessions per active user
9. **ESG Reports Generated** - Audit-ready reports exported per quarter
10. **Carbon Credits Tracked** - Total tCO2e managed through platform

### Growth Metrics
11. **Country Coverage** - Active projects across African countries
12. **SDG Coverage** - Distribution of reports across all 17 SDGs
13. **Funding Unlocked** - Total funding attributed to DevMapper-verified projects

---

## Product Guardrails

### What We Are NOT Building
- No full project management tool (Not Asana/Monday)
- No generic social network (Not LinkedIn/Facebook)
- No custom ERP systems for NGOs
- No blockchain-first product (hash-chain audit trail, blockchain optional later)
- No heavy free-form AI chat UI (structured AI with templates only)
- No general-purpose CRM (admin CRM is internal only)
- No payment processing platform (integrate with Flutterwave/Paystack)

### What We ARE Building
- Structured reporting + multi-tier verification system
- Lightweight AI-assisted workflows (Ndovu Akili AI)
- Trust layer for development data (cryptographic hash-chain ledger)
- Scalable API-first infrastructure
- IFRS S1/S2 compliance engine
- Carbon market readiness (Scope 1/2/3, Article 6, ITMO)
- Multi-country regulatory intelligence (REM)
- dMRV integration (satellite + IoT + community evidence)

---

## Platform Architecture Principles

1. **Project-centric** - Everything anchors to reports/projects
2. **Actor-centric** - Universal Actor Ontology (UAO) for all entity types
3. **Evidence-driven** - All claims require evidence; AI suggests, humans verify
4. **Audit-grade** - Hash-chain verification ledger for tamper-proof records
5. **Multi-tenant** - Organization-scoped data with RLS
6. **API-first** - All features accessible via API for future integrations
7. **Africa-context** - 54-country regulatory intelligence, multi-currency, multilingual (EN/FR/AR/PT/SW)

---

## Technology Non-Negotiables

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite + Tailwind + shadcn/ui | Fast iteration, component library |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) | Managed infrastructure, RLS, realtime |
| AI | OpenAI via structured prompts + RAG | Controlled outputs, auditable |
| Maps | MapLibre GL + Leaflet | Open-source, Africa-optimized |
| Payments | Flutterwave + Paystack | Africa-native payment rails |
| Satellite | Google Earth Engine + Sentinel Hub | dMRV evidence layer |

---

**Document Version:** 2.0
**Last Updated:** 2026-03-30
**Consolidates:** V1 Build Intent + all uploaded strategic documents (V1-V9 PRDs)
