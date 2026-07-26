# DevMapper PRD V9.2 — Comprehensive Platform Roadmap
## Date: 2026-05-14 (supersedes V9.1 dated 2026-04-02)

---

## 0. V9.2 Status Corrections (audit 2026-05-14)

End-to-end PRD-vs-code audit reclassified 17 items previously marked **Not Built / Partial** as **✅ Built**. Treat the following as shipped:

| # | Feature | Evidence |
|---|---|---|
| 23 | Framework Gap Analysis | `src/components/esg/FrameworkGapAnalysis.tsx`, `ComplianceScoresDashboard.tsx` |
| 30–44 | Ndovu prompt library / specialized agents | `NdovuQuickActions.tsx` + 7 `ndovu-*` edge functions |
| 45 | Ndovu Orchestrator | `supabase/functions/ndovu-orchestrator` |
| 46 | Ndovu Verifier agent | `supabase/functions/ndovu-verifier` |
| 47 | Ndovu Investor agent | `supabase/functions/ndovu-investor` |
| 48 | Ndovu Regulator agent | `supabase/functions/ndovu-regulator` |
| 49 | Ndovu Project Developer agent | `supabase/functions/ndovu-project-developer` |
| 50 | Ndovu Supplier agent | `supabase/functions/ndovu-supplier` |
| 51 | Ndovu Carbon Trader agent | `supabase/functions/ndovu-carbon-trader` |
| 52 | Multi-agent synthesis + audit logging | orchestrator + `audit_logs` table |
| 72 | Audit trail export | `src/components/verification/AuditTrailExport.tsx` |
| 73 | Verifier Marketplace | `src/pages/VerifierMarketplace.tsx`, migration `20260402135129` |
| 74 | Verifier reputation system | `verifier_profiles.reputation_score` + `update_verifier_reputation` trigger |
| 75 | Auto-assign verifier | `auto_assign_verifier()` RPC |
| 78 | Carbon Marketplace lifecycle | `pages/CarbonMarketplace.tsx`, `marketplace_listings`, `update_listing_credits_on_order` |
| 79 | Carbon Portfolio | `pages/CarbonPortfolio.tsx` |
| 80 | Marketplace transactions | `marketplace_orders` table |
| 81 | Listing status automation | `update_listing_credits_on_order` trigger |
| 111 | Impact Credibility Score | `src/lib/impact-credibility.ts`, `ImpactCredibilityBadge.tsx` |

**Revised completion estimate:** ~65–70% of PRD scope built (was 50% in V9.1).

### Closed in V9.2 cycle
- ✅ Frameworks + indicators seed (GRI, CDP, CSRD/ESRS, SBTi, TCFD, IFRS S1/S2, NG-FRC SRG1) — migration `20260514`.
- ✅ Emission factors reference library (Scope 1/2/3, DEFRA 2024 / IEA 2024 / IPCC AR6) — unblocks PRD #92–94.
- ✅ Contact form delivery (#117) — `send-contact-email` edge function + `contact_submissions` table.
- ✅ Orphan `pages/api/**` Next.js routes removed (Vite project — never executed).
- ✅ Docs hygiene: V2–V8 PRDs moved to `docs/archive/`, `docs/README.md` points to V9.2 as canonical.

### Still open (priority order)
1. **#82–83** — Smart pricing engine + purchase/retirement payment flow.
2. **#85–86, #88** — Cross-entity workflows, shared workspaces, secure data exchange.
3. **#92** — ERP connector framework (`emission_factors` table now available as join target).
4. **#112–114** — Funding Readiness, Risk Flags, Funder Decision Dashboard.
5. **PRD-to-code traceability** — embed feature IDs in component/function comments.
6. **Test coverage** — only ~10 frontend tests against ~250 components.

---

## 0.1 V9.3 Status Corrections (audit 2026-07-10)

Full 117-feature + Appendix re-audit against current code (static analysis: existence + import-chain reachability, not live testing). **43 of 117 features (37%) changed status.** Net direction: the PRD has been *underselling* progress — the multi-agent AI layer, carbon marketplace, and standards engine (CDP/SBTi/GLEC/LCA/GPC) are substantially more built than this document indicates. A handful of items went the other way: some V9.2-cited evidence pointed at components that turned out to be dead code.

**Revised completion estimate: 79% built, 13% partial, 5% not built, 3% future** (was 65–70% under V9.2's own estimate, 50% in the original V9.1 table below).

### Upgraded to ✅ Built (previously ❌/🟡, now confirmed wired to a reachable route)
#20 CDP framework alignment, #21 CSRD module (🟡, checklist only), #22 SBTi target validation, #30–33/#35–42/#44 Ndovu prompt library (real path is `AICopilotQuickActions.tsx`, not the V9.2-cited `NdovuQuickActions.tsx` — see dead code below), #45–52 full multi-agent architecture (orchestrator + 6 specialized agents + synthesizer — deployed function names differ from PRD: `ndovu-verifier-agent`/`ndovu-project-agent`/`ndovu-trader-agent`, not `ndovu-verifier`/`-project-developer`/`-carbon-trader`), #73–75 Verifier Marketplace/reputation/auto-assign (V9.2 claim confirmed accurate), #78 project listing, #81 credit lifecycle, #83 purchase/retirement flow, #86 shared workspaces, #88 data exchange layer, #92/#94 ERP connector UI + local emission factor tables, #111–113 Impact Credibility/Funding Readiness/Risk Flags (V9.2 already had #111; #112–113 are new), #117 contact form (V9.2 claim confirmed accurate), and all 6 Standards Engine Phase 2/3 items (CDP questionnaire, SBTi pathway generator, Verra/Gold Standard mapping, GLEC transport, ISO 14040/44 LCA, GPC city aggregation) — all converge on one mount point, `StandardsPhase2Panel.tsx` in `ESG.tsx`.

### Downgraded / newly-flagged as dead code (component exists, was cited as evidence, but has zero importers anywhere in the app)
| Component | Cited for | Real (working) path instead |
|---|---|---|
| `src/components/pm/VerificationPanel.tsx` | #3, #71 | `SPVFVerificationPanel.tsx` |
| `src/components/realtime/RealtimeForumUpdates.tsx` | #5 | none — Forum has **no live realtime subscription at all**; #5 downgraded to 🟡 |
| `src/components/messages/ConversationList.tsx`, `MessageThread.tsx` | #6 | `Messages.tsx` (duplicates the logic inline) |
| `src/components/ai/NdovuQuickActions.tsx` | V9.2's #30–44 | `AICopilotQuickActions.tsx` |
| `src/components/verification/AuditTrailExport.tsx` | V9.2's #72 | **none — still unreachable.** V9.2 marked #72 built based on this component's existence, but it was never mounted anywhere; users cannot actually export an audit trail today. #72 reverts to 🟡. |

Also downgraded: **#9 Evidence upload** → 🟡 (SubmitReport.tsx uses a raw storage upload path that bypasses the `evidence_items`/`FileUpload` flow used elsewhere — two divergent, inconsistent upload paths, not one unified feature as implied).

### Corrected Section 8 summary (see full table replacing the one below)
| Category | Total | ✅ Built | 🟡 Partial | ❌ Not Built | 🔮 Future |
|---|---|---|---|---|---|
| Core Platform (V1-V3) | 10 | 8 | 2 | 0 | 0 |
| ESG & Compliance (V4-V5) | 14 | 11 | 2 | 1 | 0 |
| AI Layer (V6 + Prompts) | 20 | 18 | 0 | 2 | 0 |
| Multi-Agent Architecture | 10 | 8 | 1 | 0 | 1 |
| Project Management (V7) | 9 | 9 | 0 | 0 | 0 |
| Carbon Evolution (V8) | 6 | 6 | 0 | 0 | 0 |
| Verification & Trust | 8 | 5 | 3 | 0 | 0 |
| Carbon Marketplace | 6 | 3 | 2 | 1 | 0 |
| Multi-Stakeholder | 5 | 3 | 2 | 0 | 0 |
| Integration Layer | 9 | 5 | 1 | 0 | 3 |
| Platform & UX | 20 | 16 | 2 | 2 | 0 |
| **TOTAL** | **117** | **92** | **15** | **6** | **4** |

### Still genuinely absent (confirmed, no PRD change)
#19 GRI native indicator mapping, #34 Satellite Validation prompts, #43 Guided Workflow prompts, #82 Smart pricing (AI-driven), #95–97 World Bank/IATI/satellite auto-validation, #115 Badge & Reputation System, #116 Social Proof.

### Recommended next actions (priority order)
1. Delete or re-wire the 5 dead-code components above — `AuditTrailExport` and `RealtimeForumUpdates` are the most user-visible gaps (no working audit-export button; no live forum updates despite the feature name implying otherwise).
2. Reconcile #9's two divergent evidence-upload code paths.
3. #93 ERP sync only maps fuel/electricity/heat — Scope 3 procurement categories remain unmapped (per the sync module's own docstring).
4. Correct Ndovu edge function names in this doc (`ndovu-verifier-agent` etc., not the V9.2-listed names) to prevent future audit drift.
5. #82, #115, #116 are the lowest-risk items to leave as-is (genuinely not built, low ambiguity).

---

## 0.2 V9.4 Completion Update (2026-07-14)

All 25 items from the V9.3 "still genuinely absent" + Partial list have been built and live-verified (not just code-reviewed): #9, #19, #21, #34, #43, #53, #76, #79, #80, #82, #85, #87, #93, #95, #97, #110, #114, #115, #116, plus the 5 dead-code components (4 deleted as confirmed zero-importer dead code, `AuditTrailExport` and `RealtimeForumUpdates` wired up rather than deleted since they were real, working, just unmounted).

**This same pass also found the individual feature rows in section 8 (rows 19–117) were themselves stale independent of the V9.3 summary above** — many items the V9.3 audit had already reclassified Built in its prose (line 58) were never actually updated in the row-by-row table, and several more (rows 30–54's individual AI prompts/agents, #72–75/77, #78/81, #86/88, #92/94, #111–113) were confirmed Built via direct code inspection this pass, independent of anything built this session. Section 8's table has been corrected row-by-row to match; **do not trust the TOTAL row in the table at line 85 above, it now undercounts Built** — a corrected total is below.

**Revised completion estimate: 114/117 (97%) built, 3/117 (3%) partial. Zero items fully "Not Built."**

### The only 3 non-Built items — all genuinely blocked, not code gaps
| # | Feature | Status | What's blocking it |
|---|---|---|---|
| 83 | Carbon credit purchase/retirement flow | 🟡 Partial | Order/checkout/webhook code is correct (confirmed via a live, user-authorized call to the real Flutterwave API). `FLUTTERWAVE_SECRET_KEY` is configured but invalid ("Invalid authorization key" from Flutterwave itself); `PAYSTACK_SECRET_KEY` isn't set. Needs a valid key from either provider. |
| 96 | IATI (Aid Transparency) integration | 🟡 Partial | `iati-proxy` edge function built and deployed, ready to activate. IATI's Datastore API returned a live 401 requiring a registered `Ocp-Apim-Subscription-Key` — needs that credential. |
| 117 | Contact form email delivery | 🟡 Partial | Submission is saved and admins are notified in-app, but no outbound email is ever sent — no SMTP/Resend/SendGrid provider is configured (confirmed via the edge function's own code comment). Needs an email provider credential + a few lines wiring it in. |

None of the 3 need further code investigation — each has a named, specific external credential/service blocking it, documented at its row in section 8.

---

## 0.3 V9.5 Completion Update (2026-07-26)

**#96 IATI (Aid Transparency) integration is now fully built and live-verified**, closing the credential gap documented in V9.4. `IATI_API_KEY` was registered and configured (Exploratory tier first, then upgraded to a Full Access subscription — the Exploratory tier's rate limit proved too tight for concurrent dashboard traffic). Live-verified end to end:
- Direct call to `iati-proxy` for Kenya returned real activities (Zoological Society of London, FSD Africa, Slovak Foreign Ministry programs, etc.), not placeholder data.
- `AidFlowDataCard` on `NgoDashboard` renders that same real data once an NGO has a project with a `country_code` set — confirmed via a live UI render (screenshot), not just API inspection.

**Bug found and fixed during this verification:** `iati-proxy` treated IATI's `429 Rate limit exceeded` the same as any other upstream failure, surfacing a generic HTTP 500 to the client (visible as a browser console error). Fixed in both files:
- `supabase/functions/iati-proxy/index.ts` — a 429 now returns `HTTP 200` with `{ configured: true, activities: [], rateLimited: true, message: "..." }` instead of throwing.
- `src/components/ngo/AidFlowDataCard.tsx` — tracks the `rateLimited` flag and shows the friendly retry message instead of the misleading "No IATI-reported activities found for this country."

Re-verified live after the fix and the key upgrade: a 20-request concurrent burst against fresh, uncached countries returned zero 500s — requests either returned real data or gracefully degraded to the rate-limited message. (Even Full Access has a concurrency ceiling — 8/20 succeeded in that artificial burst — but a real dashboard load only ever fires one request at a time, so this is expected to be a non-issue in practice.)

**Revised completion estimate: 115/117 (98%) built, 2/117 (2%) partial. Zero items fully "Not Built."**

### The only 2 remaining non-Built items — both genuinely blocked, not code gaps
| # | Feature | Status | What's blocking it |
|---|---|---|---|
| 83 | Carbon credit purchase/retirement flow | 🟡 Partial | Order/checkout/webhook code is correct (confirmed via a live, user-authorized call to the real Flutterwave API). `FLUTTERWAVE_SECRET_KEY` is configured but invalid ("Invalid authorization key" from Flutterwave itself); `PAYSTACK_SECRET_KEY` isn't set. Needs a valid key from either provider. |
| 117 | Contact form email delivery | 🟡 Partial | Submission is saved and admins are notified in-app, but no outbound email is ever sent — no SMTP/Resend/SendGrid provider is configured (confirmed via the edge function's own code comment). Needs an email provider credential + a few lines wiring it in. |

---

# DevMapper PRD V9.1 — Comprehensive Platform Roadmap (historical)
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
| 19 | GRI native indicator mapping (metric_key → GRI codes) | ✅ Built | GRI tab in StandardsPhase2Panel.tsx, real framework_indicators mapping |
| 20 | CDP framework alignment | ✅ Built | cdp-questionnaire.ts + CDP tab (auto-fill, readiness %, save/persist) |
| 21 | CSRD compliance module | ✅ Built | CSRD tab in StandardsPhase2Panel.tsx, real framework_indicators mapping |
| 22 | SBTi target validation | ✅ Built | sbti-pathways.ts + SBTi tab (sector/scenario pathway calc, save/list) |
| 23 | Compliance dashboard with visual gap analysis | ✅ Built | FrameworkGapAnalysis (ESG Dashboard "Frameworks" tab), wired to real esg_indicators data via ESGDashboard.tsx |
| 24 | Auto-generated ESG reports from esg_metrics | ✅ Built | ESGReportGenerator (ESG Dashboard "Reports" tab), pulls real indicators/suppliers/scenarios/benchmark data |

### 3.3 AI Layer — Ndovu Akili AI (V6 + Ndovu Prompt Library)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 25 | Ndovu Akili AI with 4 context modes | ✅ Built | AICopilot with General/Compliance/Report/Carbon |
| 26 | Streaming SSE responses | ✅ Built | Via Lovable AI Gateway |
| 27 | Persistent conversation history | ✅ Built | ai_conversations table |
| 28 | Quick action presets (WB, UNDP, AfDB, GEF) | ✅ Built | AICopilotQuickActions |
| 29 | Scheduled compliance agent | ✅ Built | compliance-check edge function |
| 30 | **Emissions Analysis prompts** | ✅ Built | AICopilotQuickActions.tsx |
| 31 | **Emissions Gap Detection prompts** | ✅ Built | " |
| 32 | **Project Credibility Check prompts** | ✅ Built | " |
| 33 | **Verification Assistant prompts** | ✅ Built | " |
| 34 | **Satellite Validation prompts** | ✅ Built | Satellite Cross-Check + Evidence Completeness Check, mounted in SPVFVerificationPanel with pageContextOverride |
| 35 | **Carbon Credit Recommendation prompts** | ✅ Built | AICopilotQuickActions.tsx |
| 36 | **Portfolio Builder AI prompts** | ✅ Built | " |
| 37 | **ROI Analysis prompts** | ✅ Built | " |
| 38 | **Net-Zero Roadmap prompts** | ✅ Built | " |
| 39 | **Supplier Engagement Strategy prompts** | ✅ Built | " |
| 40 | **Regulatory Alert Generator prompts** | ✅ Built | " |
| 41 | **Government Review prompts** | ✅ Built | " |
| 42 | **Investor Due Diligence prompts** | ✅ Built | " |
| 43 | **Guided Workflow prompts** | ✅ Built | Guided Report Submission + Guided Certification Application (conversational, multi-step) |
| 44 | **Expert/Beginner mode toggle** | ✅ Built | AICopilot.tsx expertMode toggle |

### 3.4 Multi-Agent AI Architecture (Ndovu Agents)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 45 | Orchestrator (intent routing to agents) | ✅ Built | ndovu-orchestrator edge function - auth, plan rate-limiting, intent classification, agent-map routing |
| 46 | **Verifier AI** (trust engine, greenwashing detection) | ✅ Built | ndovu-verifier-agent edge function |
| 47 | **Investor AI** (ROI, payback, portfolio fit) | ✅ Built | ndovu-investor-agent edge function |
| 48 | **Regulator AI** (GRI/CDP/CSRD gap analysis) | ✅ Built | ndovu-regulator-agent edge function |
| 49 | **Project Developer AI** (step-by-step project design) | ✅ Built | ndovu-project-agent edge function, now with RAG-retrieved similar-project context |
| 50 | **Supplier AI** (Scope 3 completeness scoring) | ✅ Built | ndovu-supplier-agent edge function |
| 51 | **Carbon Trader AI** (buy/sell timing, retirement) | ✅ Built | ndovu-trader-agent edge function |
| 52 | Multi-agent synthesis output format | ✅ Built | ndovu-synthesizer edge function - weighted synthesis, confidence aggregation |
| 53 | RAG pipeline with pgvector | ✅ Built | pgvector + report_embeddings + match_report_embeddings RPC, wired into ndovu-project-agent's dataFetcher. Verified live: real semantic search correctly ranked an on-topic report at 0.844 similarity vs 0.112 for an unrelated one |
| 54 | AI output audit logging | ✅ Built | ai_audit_log inserts in agent-utils.ts (handleAgent), ndovu-orchestrator, ndovu-synthesizer |

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
| 72 | Exportable audit trails (PDF/JSON) | ✅ Built | AuditTrailExport.tsx, mounted in SPVFVerificationPanel |
| 73 | **Verifier Marketplace** (auditors, field agents) | ✅ Built | VerifierMarketplace.tsx - browse/leaderboard/assignments |
| 74 | **Verifier reputation system** (scoring, leaderboard) | ✅ Built | verifier_profiles.reputation_score, ranked leaderboard tab |
| 75 | **Auto-assign verifier workflow** | ✅ Built | auto_assign_verifier() SQL function (picks highest-reputation available certified verifier) |
| 76 | **Proof-of-impact system** (satellite + geotagged evidence linked) | ✅ Built | Real GEE NDVI reading linked as evidence on geotagged report submission, plus auto-validation pass (#97) flagging implausible readings |
| 77 | **Immutable audit trail export** for regulators | ✅ Built | Same AuditTrailExport.tsx as #72 |

### 3.8 Carbon Marketplace (New — Pillar 2)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 78 | **Project listing system** (rich metadata, verification badge) | ✅ Built | CarbonMarketplace.tsx listing form (project type, methodology, vintage, SDGs, verification badge) |
| 79 | **Buyer interface** (filter by SDG, geography, certification) | ✅ Built | Type/country/SDG filters + sort in CarbonMarketplace.tsx |
| 80 | **Portfolio builder** (diversified carbon portfolios) | ✅ Built | CarbonPortfolio.tsx + concentration-risk analysis (portfolio-diversification.ts) |
| 81 | **Credit lifecycle tracking** (issuance → listing → purchase → retirement) | ✅ Built | marketplace_listings → carbon_credit_orders → retire_carbon_credit_order RPC (retirement certificate generation, /certificates/:certificateNumber verification page) |
| 82 | **Smart pricing** (AI-driven pricing suggestions) | ✅ Built | marketplace-pricing.ts + SuggestedPriceHint, mounted in the listing-creation form |
| 83 | **Carbon credit purchase/retirement flow** | 🟡 Partial | Order/checkout code path and create-payment error handling are correct (verified via a live call); blocked purely on credentials — the configured FLUTTERWAVE_SECRET_KEY returns "Invalid authorization key" from Flutterwave's live API, and PAYSTACK_SECRET_KEY isn't set at all. Supply a valid key for either provider to activate. |

### 3.9 Multi-Stakeholder Ecosystem (New — Pillar 4)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 84 | Role-based dashboards | ✅ Built | Corporate/Government/NGO/Citizen dashboards |
| 85 | Cross-entity workflows (Corporate funds → Verifier validates → Gov reviews) | ✅ Built | Real routing: report owner → verification_assignments → verifier accept/complete → project_verifications routed to a specific government reviewer's queue |
| 86 | **Shared workspaces** (invite stakeholders to project) | ✅ Built | StakeholderAffiliation.tsx + project_affiliations |
| 87 | **Task assignments** ("Upload evidence", "Review methodology") | ✅ Built | Kanban assignment picker (project_affiliations + organization_data_shares grantees), verified live with a genuine cross-org assignee |
| 88 | **Data exchange layer** (secure sharing of emissions/project data) | ✅ Built | org-data-shares.ts + organization_data_shares table |

### 3.10 Integration Layer (New — Pillar 5)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 89 | Google Earth Engine proxy | ✅ Built | gee-proxy edge function |
| 90 | Climate TRACE proxy | ✅ Built | climatetrace-proxy edge function |
| 91 | Exchange rates API | ✅ Built | exchange-rates edge function |
| 92 | **ERP connector UI** (Odoo/SAP credential entry + sync) | ✅ Built | ErpIntegrations.tsx - provider select, credential entry, triggers erp-odoo-connector/erp-sap-connector |
| 93 | **ERP sync backend** (normalize ERP data → supplier_emissions) | ✅ Built | erpEmissionsSync.ts - Scope 1 fuel/electricity + Scope 3 (transport, waste, travel, commute, purchased goods) keyword mapping to emission_factors |
| 94 | **Local emission factor tables** (seeded from Climatiq/national DBs) | ✅ Built | emission_factors table, 78 rows seeded from DEFRA 2024/IPCC AR6/IEA 2024 incl. per-country African grid factors |
| 95 | **World Bank API integration** | ✅ Built | worldbank-proxy edge function (public API, no key needed) - real GDP/population/poverty/CO2 indicators in DonorReportExport.tsx's "Country Development Context" section. Verified live against the real API (Kenya: GDP $120.4B, population 56.4M) |
| 96 | **IATI (Aid Transparency) integration** | ✅ Built | iati-proxy edge function live with a Full Access IATI_API_KEY - verified live: real activity data returned for multiple countries and confirmed rendering in AidFlowDataCard on NgoDashboard. 429 rate-limit responses now degrade gracefully (200 + retry message) instead of surfacing as a 500 (fixed 2026-07-26) |
| 97 | **Satellite imagery auto-validation** | ✅ Built | satellite-validation.ts - NDVI reading auto-checked against the report's SDG goal for plausibility, flags a "Mismatch" badge in the verification panel when implausible |

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
| 110 | PWA offline data support | ✅ Built | IndexedDB offline write queue for report submission (offline-report-queue.ts) - queues + auto-syncs on reconnect, verified live with real network emulation |
| 111 | **Impact Credibility Score** per project | ✅ Built | impact-credibility.ts + ImpactCredibilityBadge, mounted in ProjectDetail.tsx |
| 112 | **Funding Readiness Indicator** | ✅ Built | funding-readiness.ts + FundingReadinessBadge, mounted in ProjectDetail.tsx and FunderDashboard.tsx |
| 113 | **Risk Flags** on projects | ✅ Built | risk-flags.ts + RiskFlagsList, mounted in ProjectDetail.tsx |
| 114 | **Decision Dashboard for Funders** | ✅ Built | funder_decisions table + Interested/Pass buttons with committed-amount tracking in FunderDashboard.tsx |
| 115 | **Badge & Reputation System** (Reporter → Verifier → Trainer) | ✅ Built | user_badges table, auto-awarded via triggers on reports.is_verified / verifier_profiles.verification_count+is_certified. Displayed on VerifierMarketplace and Forum posts |
| 116 | **Social Proof** ("First 1,000 reporters") | ✅ Built | SocialProofBanner.tsx on the landing page, real mv_dashboard_stats counts |
| 117 | **Contact form email delivery** | 🟡 Partial | send-contact-email edge function saves the submission and notifies admins in-app, but never sends an actual outbound email - no SMTP/Resend/SendGrid provider is configured (confirmed via the function's own code comment) |

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

---

# Appendix: Global Standards Alignment (V9.2 Addendum)
**Source:** Devmapper_15042026.txt — Standards Alignment Strategy

## Standards Layer Model

| Layer | Standard | DevMapper Role |
|-------|----------|----------------|
| **Measurement** | GHG Protocol | Scope 1/2/3 emissions accounting |
| **Verification** | ISO 14064/14067 | Audit & third-party certification |
| **Reporting** | CDP / ISSB / CSRD / GRI / TCFD | Multi-framework ESG disclosure |
| **Targets** | SBTi / Net Zero Standard | Decarbonization pathways |
| **Markets** | Verra / Gold Standard / Article 6 / ICVCM | Carbon credit integrity |
| **Sector** | GLEC (transport), GPC (cities), ISO 14040 (LCA) | Specialized accounting |
| **Science** | IPCC | Emission factor foundation |

## Standards Engine (Implemented in V9.2)

Every data point is taggable with:
```json
{
  "value": 1200,
  "unit": "kgCO2e",
  "standard": "GHG Protocol",
  "frameworks": ["CDP", "ISSB"],
  "confidence_score": 0.85
}
```

**Database tables:**
- `standards_metadata` — Per-record standard tagging
- `compliance_scores` — Per-organization framework alignment %

**UI components:**
- `ComplianceScoresDashboard` — Live % alignment per framework (CDP, ISSB, CSRD, SBTi, GHG Protocol)

## Implementation Prioritization

### MVP (Implemented ✅)
- GHG Protocol (esg_indicators + CarbonCalculator)
- IFRS S1/S2 (IFRSReadinessAssessment)
- Article 6 / ITMO (carbon_compliance)
- Standards Engine schema (V9.2)

### Phase 2 (In Progress ⚠️)
- CDP auto-filled questionnaire
- SBTi pathway generator
- Verra/Gold Standard methodology mapping

### Phase 3 (Planned ❌)
- GLEC transport/freight emissions module
- Full ISO 14040/14044 LCA workflow
- GPC city/state/national aggregation

## Ndovu Akili AI Role
The AI copilot translates between frameworks, explains compliance gaps using `compliance_scores` data, and recommends remediation actions per the standards engine metadata.
