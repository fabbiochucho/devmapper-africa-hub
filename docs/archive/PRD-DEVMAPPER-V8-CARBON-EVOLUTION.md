# DevMapper Product Requirements Document (PRD)
## Version 8.0 — Carbon Intelligence & Sustainability Evolution
### Date: 2026-03-20

---

## Executive Summary

This PRD defines the phased evolution of DevMapper from an SDG/ESG tracking platform into a **unified ESG, Carbon, Circular Economy, and Impact Intelligence Infrastructure**. It follows the principle of **Sequential Layer Activation** — extending existing structures without redesign.

**Design Rule (Non-negotiable):**
- No new navigation systems
- No UI redesign
- Only: new tabs inside projects, new fields in existing forms, new dashboard widgets, toggle-based advanced sections

**Core Data Anchor:**
Everything attaches to: **Project → Report → Dashboard → Verification**

---

## Current State Assessment

### What DevMapper Already Has ✅
| Capability | Status |
|-----------|--------|
| SDG & ESG-aligned project tracking | ✅ Complete |
| Multi-stakeholder ecosystem (8 roles) | ✅ Complete |
| SPVF 7-Stage Verification | ✅ Complete |
| GHG Scope 1-3 Tracking (ESG Module) | ✅ Complete |
| Geospatial + Earth Intelligence | ✅ Complete |
| IFRS S1/S2 & Nigeria FRC SRG1 Compliance | ✅ Complete |
| Community Verification | ✅ Complete |
| Certification Rating (Platinum/Gold/Silver/Bronze) | ✅ Complete |
| Subscription Billing (5 tiers) | ✅ Complete |
| AI Copilot (Phase 1) | ✅ Complete |

### What Needs to Be Added (5 Layers)
| Layer | Description | Dependencies |
|-------|------------|-------------|
| 1. Carbon Foundation | Per-project carbon tracking + financial signals | None (current ESG is org-level) |
| 2. Decarbonisation + Climate | Reduction pathways, methane, climate risk | Layer 1 |
| 3. Circular Economy | Material flows, waste, circularity scoring | Layer 1 |
| 4. Carbon Asset Management | Credit tracking, portfolio, valuation | Layer 1 + 2 |
| 5. Article 6 + Compliance | ITMO, ER credits, compliance dashboard | Layer 1 + 2 + 4 |

**Parallel Track:** Profitable Sustainability (ROI engine) — starts in Layer 1, matures through Layer 5.

---

## Phase 1: Carbon Foundation + Basic Financials

### Objective
Enable carbon visibility and basic financial context at the **project level** (currently emissions are only tracked at org level via ESG module).

### Timeline: 2-3 weeks

### Features

#### 1.1 Report Form Extension
Add new section: **"Carbon Data"** to `ReportStep2` or new `ReportStep3`:

| Field | Type | Required |
|-------|------|----------|
| Emission Source | Dropdown (Energy, Transport, Agriculture, Waste, Industrial) | Optional |
| Scope Type | Multi-select (Scope 1, 2, 3) | Optional |
| Estimated Emissions (tCO₂e) | Numeric | Optional |
| Reporting Period | Date range | Optional |

Add new section: **"Financial Snapshot"**:

| Field | Type | Required |
|-------|------|----------|
| Project Cost | Currency | Existing (`cost` field) |
| Funding Source | Dropdown (Government, Donor, Corporate, Self-funded) | Optional |
| Estimated Cost Savings | Currency | Optional |

#### 1.2 Project Page — "Carbon" Tab
Inside `ProjectWorkspace`, add Carbon tab showing:
- Total project emissions
- Emissions by source
- Emission trend (across progress updates)
- "Carbon Data Verified?" status badge

#### 1.3 Dashboard Enhancements
New widgets on role-specific dashboards:
- Total emissions (organization-wide, aggregated from projects)
- Emissions by sector
- Cost vs emissions scatter chart

#### 1.4 Verification Upgrade
Add to verification workflow:
- "Carbon Data Verified" (Yes/No)
- Evidence Upload (mandatory for carbon claims)
- Timestamp + verifier ID

### Database Changes Required
```sql
-- Extend reports table (or create carbon_data table)
CREATE TABLE project_carbon_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  emission_source TEXT,
  scope_types TEXT[],
  estimated_emissions_tco2e NUMERIC,
  reporting_period_start DATE,
  reporting_period_end DATE,
  funding_source TEXT,
  estimated_savings NUMERIC,
  carbon_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_carbon_data ENABLE ROW LEVEL SECURITY;
```

### Success Metrics
- % of projects with carbon data
- Verified vs unverified carbon entries
- Active usage of carbon tab

---

## Phase 2: Decarbonisation + Circularity

### Objective
Move from tracking → optimization + resource intelligence.

### Timeline: 2.5-3 weeks (after Phase 1)

### Features

#### 2.1 Decarbonisation Planning
Inside project, new section: **"Decarbonisation Plan"**

| Field | Type |
|-------|------|
| Baseline Emissions | Numeric (auto-filled from Phase 1) |
| Target Emissions | Numeric |
| Reduction Strategy | Text |
| Target Year | Year picker |

#### 2.2 Circular Economy Fields
New section: **"Circular Economy"**

| Field | Type |
|-------|------|
| Material Input | Type + Quantity |
| Waste Generated (tonnes) | Numeric |
| Waste Recycled (tonnes) | Numeric |
| Reuse Percentage | Percentage |

#### 2.3 New Tabs
- **"Climate"** tab: Baseline vs current emissions, reduction %, progress toward target
- **"Circularity"** tab: Waste diversion rate, recycling %, circularity score

#### 2.4 Circularity Score Formula
```
Circularity Score = (Waste Recycled / Waste Generated) × 0.5
                  + (Reuse % / 100) × 0.3
                  + (Material Efficiency Factor) × 0.2
```

#### 2.5 Methane Module (Lightweight)
- Methane-specific emissions field
- Sector tagging (agriculture, oil & gas, waste)
- High emission flags

### Database Changes
```sql
CREATE TABLE project_decarbonisation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  baseline_emissions NUMERIC,
  target_emissions NUMERIC,
  reduction_strategy TEXT,
  target_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_circularity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  material_input_type TEXT,
  material_input_quantity NUMERIC,
  waste_generated_tonnes NUMERIC,
  waste_recycled_tonnes NUMERIC,
  reuse_percentage NUMERIC,
  circularity_score NUMERIC,
  methane_emissions_tco2e NUMERIC,
  methane_sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Success Metrics
- % projects with reduction targets
- Average emission reduction %
- Waste diversion rates

---

## Phase 3: Carbon Asset Management

### Objective
Enable carbon monetisation tracking (NOT trading, NOT exchange — tracking + intelligence only).

### Timeline: 2.5-3 weeks (after Phase 2)

### Features

#### 3.1 Project-Level Carbon Credits
New section in project: **"Carbon Credits"**

| Field | Type |
|-------|------|
| Generates Carbon Credits? | Yes/No |
| Estimated Credits (tCO₂e) | Numeric |
| Methodology | Dropdown (CDM, VCS, Gold Standard, Other) |
| Verification Status | Dropdown (Unverified, Pending, Verified) |

#### 3.2 Organization-Level Carbon Asset Dashboard
Dashboard section (NOT new page):
- Total credits generated
- Credits owned
- Credits retired
- Estimated portfolio value (credits × reference price)

#### 3.3 Credit Metadata
- Project origin link
- Methodology reference
- Verification stage
- Issuance date

### Database Changes
```sql
CREATE TABLE carbon_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  report_id UUID REFERENCES reports(id),
  credits_generated NUMERIC,
  credits_owned NUMERIC,
  credits_retired NUMERIC,
  methodology TEXT,
  verification_status TEXT DEFAULT 'unverified',
  reference_price_usd NUMERIC,
  estimated_value_usd NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Success Metrics
- Total credits tracked
- % verified credits
- Portfolio value visibility

---

## Phase 4: Article 6 + Compliance Layer

### Objective
Enable regulatory alignment and global carbon credibility.

### Timeline: 3-3.5 weeks (after Phase 3)

### Features

#### 4.1 Carbon Compliance Fields
New section: **"Carbon Compliance"**

| Field | Type |
|-------|------|
| Country of Origin | Country picker |
| Jurisdiction | Text |
| Compliance Type | Dropdown (Voluntary, Compliance) |
| ITMO Eligible? | Yes/No (Article 6.2) |
| Transfer Log | Log entries |
| Project Status | Dropdown (Registered, Verified, Issued) (Article 6.4) |
| ER Credits Issued | Numeric |

#### 4.2 Compliance Dashboard
- Emissions vs allowable thresholds
- Offset gap (emissions - credits)
- Carbon liability estimate

#### 4.3 Audit + Traceability
- Ownership logs (who holds credits)
- Transfer history
- Verification checkpoints with timestamps

### Database Changes
```sql
CREATE TABLE carbon_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  organization_id UUID REFERENCES organizations(id),
  country_of_origin TEXT,
  jurisdiction TEXT,
  compliance_type TEXT,
  itmo_eligible BOOLEAN DEFAULT FALSE,
  article6_status TEXT,
  er_credits_issued NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE carbon_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carbon_asset_id UUID REFERENCES carbon_assets(id),
  from_entity TEXT,
  to_entity TEXT,
  credits_transferred NUMERIC,
  transfer_date TIMESTAMPTZ,
  ownership_proof TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Success Metrics
- % compliance-ready projects
- Verified ER credits
- Audit completeness score

---

## Phase 5: Profitable Sustainability Engine

### Objective
Turn DevMapper into a decision + ROI platform.

### Timeline: 2-3 weeks (after Phase 4)

### Features

#### 5.1 Financial Impact Fields
New section per project: **"Financial Impact"**

| Field | Type |
|-------|------|
| Operational Cost Savings | Currency |
| Revenue Generated | Currency |
| Carbon Credit Value | Auto-calculated |
| Efficiency Gains % | Percentage |

#### 5.2 ROI Calculation
```
ROI = (Savings + Revenue - Cost) / Cost × 100
```

#### 5.3 Executive Dashboard
One-page decision view:
- Sustainability ROI
- Total carbon asset value
- Cost savings from sustainability initiatives
- Risk exposure indicator

### Success Metrics
- ROI visibility across projects
- Total savings tracked
- Carbon revenue tracked

---

## Governance Layer (Parallel — All Phases)

Across ALL phases, every data entry must include:
- ✅ Verification status (required)
- ✅ Evidence uploads (mandatory for claims)
- ✅ Audit trail (via `esg_audit_logs` + `audit_logs`)
- ✅ Flag unverified claims (warning badges)

This protects against **greenwashing risk** — critical for Article 6, compliance markets, and investor credibility.

---

## UI Implementation Rules

### No Redesign — Only Extension
```
Project Page becomes:
├── Overview (existing)
├── ESG (existing)
├── Carbon (Phase 1) — NEW TAB
├── Climate (Phase 2) — NEW TAB
├── Circularity (Phase 2) — NEW TAB
├── Financial Impact (Phase 5) — NEW TAB
└── Compliance (Phase 4) — NEW TAB

Dashboard becomes:
├── ESG Metrics (existing)
├── Carbon Metrics (Phase 1) — NEW WIDGET
├── Circular Metrics (Phase 2) — NEW WIDGET
├── Financial Metrics (Phase 5) — NEW WIDGET
└── Carbon Assets (Phase 3) — NEW SECTION

Forms:
├── Existing report steps (unchanged)
└── New sections added inline (not new flows)
```

---

## Total Rollout Timeline

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| Phase 1: Carbon Foundation | 2-3 weeks | 3 weeks |
| Phase 2: Decarbonisation + Circularity | 2.5-3 weeks | 6 weeks |
| Phase 3: Carbon Asset Management | 2.5-3 weeks | 9 weeks |
| Phase 4: Article 6 + Compliance | 3-3.5 weeks | 12-13 weeks |
| Phase 5: Profitable Sustainability | 2-3 weeks | 15-16 weeks |

**Fast-track option (parallelized):** 10-12 weeks

---

## Critical Dependencies

1. Data schema must be consistent across all phases
2. Verification must scale with complexity (more carbon = more evidence required)
3. Avoid duplicate data models (project_carbon_data links to reports, not separate entities)
4. Maintain project-centric architecture (everything anchors to reports table)
5. IFRS S1/S2 compliance must be maintained through all carbon additions

---

## Layered Activation Strategy

| Layer | Visible to Users | Functional | Advanced |
|-------|-----------------|-----------|---------|
| ESG | ✅ | ✅ | ✅ |
| Carbon | ✅ | ✅ | ⏳ Phase 1 |
| Climate | ✅ | ⚠️ Basic | ⏳ Phase 2 |
| Circular | ✅ | ⚠️ Basic | ⏳ Phase 2 |
| Carbon Markets | ✅ | ❌ Guided | ⏳ Phase 3-4 |
| Financial Impact | ✅ | ⚠️ Partial | ⏳ Phase 5 |

**Principle:** "Visible Full Stack — Functional Core"
- Show all modules from Day 1 (market perception of completeness)
- Activate progressively (technical integrity preserved)

---

## Strategic Positioning After Full Rollout

DevMapper becomes:
> A unified ESG, Carbon, Circular Economy, and Impact Intelligence platform that enables organizations to measure, verify, manage, and monetize sustainability outcomes.

**Differentiator:** Most platforms do ESG OR Carbon OR CSR. DevMapper connects **Impact + Carbon + Finance** into one system — that's rare, investable, and scalable.

---

**Document Version:** 8.0
**Last Updated:** 2026-03-20
**Previous Version:** PRD-DEVMAPPER-V5.md
**Source Documents:** Devmapper_20032026.txt, Devmapper_1932026.txt
**Next Review:** Upon Phase 1 completion
