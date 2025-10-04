# DevMapper Full Product Implementation Analysis
*Date: October 4, 2025*  
*Status: Option 2 - Layer ESG on existing SDG infrastructure*

## Executive Summary

This document analyzes the current state of DevMapper against the PRD (Product Requirements Document) and Extended Scope 3 specifications. We're implementing **Option 2**: Carefully layering ESG tables and features on top of the existing Supabase SDG infrastructure while ensuring zero conflicts between modules.

---

## 1. Current Implementation Status

### ✅ **COMPLETED - Core SDG Module (Phase 0)**

#### Database Layer
- **Authentication & Authorization**
  - ✅ Supabase auth with email/password
  - ✅ User roles system (`user_roles` table with `app_role` enum)
  - ✅ RLS policies for tenant isolation
  - ✅ `has_role()` security definer function (recently fixed with proper search_path)
  - ✅ Profile management (`profiles` table)

#### SDG Project Tracking
- ✅ `reports` table (SDG project submissions)
- ✅ `change_makers` table (changemaker profiles)
- ✅ `fundraising_campaigns` table
- ✅ `campaign_donations` table
- ✅ `verification_logs` table
- ✅ `forum_posts` and `forum_post_likes` tables
- ✅ `sdg_agenda2063_alignment` table
- ✅ `partners` table for public partner showcase
- ✅ Public map visualization components
- ✅ SDG tracking dashboards

#### Organizations & Billing Foundation
- ✅ `organizations` table with:
  - `plan_type` (lite/pro/enterprise)
  - `esg_enabled` boolean flag
  - `esg_suppliers_limit`, `esg_scenarios_limit`
  - `alphaearth_api_calls_limit`
  - `reporting_year`, `primary_sector`
- ✅ `organization_members` table
- ✅ `billing_events` table for payment tracking
- ✅ Flutterwave webhook integration (needs signature verification improvement)
- ✅ `organization-management` edge function for plan updates

#### Storage
- ✅ Storage buckets: `avatars` (public), `documents` (private), `project-files` (private)
- ✅ RLS policies on storage

---

### ✅ **COMPLETED - ESG Foundation (Phase 1 - Partial)**

#### ESG Database Tables (All Created!)
- ✅ `esg_indicators` - Core ESG metrics (carbon, energy, water, waste, etc.)
- ✅ `esg_suppliers` - Supplier master data
- ✅ `esg_supplier_emissions` - Scope 3 emissions tracking
- ✅ `esg_scenarios` - Scenario analysis storage
- ✅ `esg_audit_logs` - Immutable audit trail
- ✅ `alphaearth_cache` - AlphaEarth API response caching

#### ESG Components (UI Layer)
- ✅ `ESGDashboard.tsx` - Main ESG dashboard component
  - Displays indicators, suppliers, scenarios
  - Shows ESG score visualization
  - Usage limits and progress bars
  - "Enable ESG" button for orgs
- ✅ `SupplierCSVImporter.tsx` - Full CSV upload UI
  - CSV file upload with validation
  - Preview before import
  - Template download link
  - Bulk import functionality
- ✅ `/pages/ESG.tsx` - ESG page with org switcher
  - Organization selector
  - Tab navigation (Dashboard, Suppliers, Scenarios, Settings)
  - ESG enable/disable controls

#### ESG Business Logic
- ✅ `lib/alphaearth.ts` - AlphaEarth API integration
  - `getBenchmarkForOrg()` - Fetches benchmark data
  - `enrichSupplierEmissions()` - Auto-enriches supplier data
  - `getApiUsageStats()` - Tracks API usage
  - Caching layer with `alphaearth_cache` table
  - **⚠️ SECURITY ISSUE: API key in client code (flagged, needs edge function)**
- ✅ `lib/esg-audit.ts` - Audit trail helpers
  - `writeESGAuditLog()` - Immutable logging
  - `getESGAuditLogs()` - Retrieve audit history
  - Auto-logging for indicators, suppliers, scenarios

#### Edge Functions
- ✅ `organization-management` - Org plan CRUD operations
- ✅ `flutterwave-webhook` - Payment webhook handler
- ✅ `create-payment` - Payment initialization
- ❌ Missing: `alphaearth-benchmark` edge function (NEEDED for security)
- ❌ Missing: `suppliers/template` download endpoint
- ❌ Missing: `suppliers/upload` CSV processing endpoint
- ❌ Missing: `scenarios` CRUD endpoints

---

## 2. What's Missing - Prioritized by Phase

### 🔴 **CRITICAL - Security Fixes (Do First)**

1. **AlphaEarth API Key Exposure** ⚠️
   - **Problem**: `src/lib/alphaearth.ts` accesses `process.env.ALPHAEARTH_API_KEY` client-side
   - **Solution**: Create `supabase/functions/alphaearth-benchmark/index.ts` edge function
   - **Impact**: HIGH - API key will be exposed in browser, allowing unlimited API usage
   - **Files to create**:
     - `supabase/functions/alphaearth-benchmark/index.ts`
   - **Files to modify**:
     - Remove `lib/alphaearth.ts` or convert to client wrapper
     - Update `ESGDashboard.tsx` to call edge function
     - Update `SupplierCSVImporter.tsx` to call edge function
     - Add `ALPHAEARTH_API_KEY` to Supabase secrets

2. **Flutterwave Webhook Signature Verification** ⚠️
   - **Problem**: Only validates shared secret, not cryptographic signature
   - **Solution**: Implement Flutterwave signature verification
   - **Impact**: MEDIUM - Risk of payment fraud
   - **Files to modify**:
     - `supabase/functions/flutterwave-webhook/index.ts`

---

### 🟠 **HIGH PRIORITY - Phase 1: Foundation (Q2 2025)**

#### 1.1 Plan Limits & Feature Flags System

**Missing Tables:**
```sql
-- feature_flags table
CREATE TABLE feature_flags (
  key text PRIMARY KEY,
  description text,
  default_enabled boolean DEFAULT false
);

-- org_feature_flags table  
CREATE TABLE org_feature_flags (
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key text REFERENCES feature_flags(key),
  enabled boolean DEFAULT false,
  PRIMARY KEY (org_id, flag_key)
);

-- org_usage_counters table
CREATE TABLE org_usage_counters (
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  metric text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  count int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (org_id, metric, period_start, period_end)
);

-- plan_limits table
CREATE TABLE plan_limits (
  plan_type text NOT NULL,
  metric text NOT NULL,
  limit_value int, -- NULL = unlimited
  PRIMARY KEY (plan_type, metric)
);
```

**Missing Functions:**
```sql
-- get_org_plan_type(p_org uuid) RETURNS text
-- is_flag_enabled_for_org(p_org uuid, p_flag text) RETURNS boolean
-- get_plan_limit(p_org uuid, p_metric text) RETURNS int
-- get_org_usage(p_org uuid, p_metric text, p_start date, p_end date) RETURNS int
-- can_create_esg_report(p_org uuid) RETURNS TABLE(allowed boolean, reason text)
-- increment_org_usage(p_org uuid, p_metric text, p_start date, p_end date, p_delta int)
```

**Missing Components:**
- Usage enforcement middleware/hooks
- Upgrade CTA modals
- Plan limit indicators in UI

**Files to create:**
- Migration: `20250000000000_plan_limits_feature_flags.sql`
- Hook: `src/hooks/useCanCreateESG.ts`
- Component: `src/components/esg/UpgradeCTA.tsx`
- Component: `src/components/esg/PlanLimitIndicator.tsx`

---

#### 1.2 SSR/SSG Optimization (SEO Critical)

**Current Problem**: SPA architecture - bots see empty HTML

**What's Needed**:
- ❌ Server-rendered homepage with hero, CTAs, meta tags
- ❌ Dynamic map with SSR disabled (`next/dynamic`)
- ❌ Proper meta tags (Open Graph, Twitter Card)
- ❌ robots.txt with sitemap reference
- ❌ sitemap.xml generation
- ❌ Favicon, apple-touch-icon, site.webmanifest
- ❌ JSON-LD structured data (Organization, WebSite)

**Note**: Lovable uses React + Vite, not Next.js. SSR requires different approach:
- Use React Helmet for meta tags
- Implement proper `index.html` with meta tags
- Consider static generation for landing pages
- Dynamic imports for heavy components (maps, charts)

**Files to create/modify**:
- `public/robots.txt`
- `public/sitemap.xml`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/site.webmanifest`
- `index.html` - Add comprehensive meta tags
- `src/pages/Index.tsx` - Optimize with React.lazy for map

---

### 🟡 **MEDIUM PRIORITY - Phase 2: ESG Pro Features (Q2-Q3 2025)**

#### 2.1 Scope 3 CSV Endpoints (Backend)

**Missing Edge Functions:**

1. **`supabase/functions/suppliers/template/index.ts`**
   ```typescript
   // GET endpoint - Returns CSV template
   // Headers: supplier_name,category,year,emissions_value,evidence_file
   ```

2. **`supabase/functions/suppliers/upload/index.ts`**
   ```typescript
   // POST endpoint - Processes CSV upload
   // - Parse CSV with validation
   // - Bulk insert into esg_supplier_emissions
   // - Call AlphaEarth enrichment (via edge function)
   // - Write audit log
   ```

3. **`supabase/functions/suppliers/manual/index.ts`**
   ```typescript
   // POST endpoint - Single supplier entry
   // - Validate input
   // - Insert into esg_supplier_emissions
   // - Write audit log
   ```

**Dependencies:**
- Need to add CSV parsing library (consider edge-compatible solution)
- Need to move AlphaEarth logic to edge function first

**Files to create:**
- `supabase/functions/suppliers/template/index.ts`
- `supabase/functions/suppliers/upload/index.ts`
- `supabase/functions/suppliers/manual/index.ts`
- Add entries to `supabase/config.toml`

---

#### 2.2 Scenario Analysis Module

**What's Already There:**
- ✅ `esg_scenarios` table (name, params, results JSONB fields)
- ✅ ESG page has "Scenarios" tab

**What's Missing:**
- ❌ Scenario creation form UI
- ❌ Scenario parameter inputs (growth rate, reduction targets, years)
- ❌ Projection calculation engine
- ❌ Chart visualization (Business-as-Usual vs Target pathways)
- ❌ Save/load scenario functionality
- ❌ Scenario comparison UI

**Missing Edge Functions:**
```typescript
// supabase/functions/scenarios/index.ts
// POST /scenarios - Create new scenario with projection
// GET /scenarios?orgId=xxx - List org scenarios
// GET /scenarios/:id - Get single scenario
// DELETE /scenarios/:id - Delete scenario
```

**Files to create:**
- `supabase/functions/scenarios/index.ts`
- `src/components/esg/ScenarioAnalysis.tsx`
- `src/components/esg/ScenarioForm.tsx`
- `src/components/esg/ScenarioChart.tsx` (using Recharts)
- `src/components/esg/ScenarioList.tsx`

**Projection Algorithm**:
```typescript
interface ScenarioParams {
  startEmissions: number;
  growthRate: number;      // BAU growth (e.g., 0.03 = 3%)
  reductionRate: number;   // Target reduction (e.g., 0.05 = 5%)
  startYear: number;
  years: number;           // Projection horizon
}

function runProjection(params: ScenarioParams) {
  const points = [];
  for (let i = 0; i <= params.years; i++) {
    const year = params.startYear + i;
    const bau = params.startEmissions * Math.pow(1 + params.growthRate, i);
    const target = params.startEmissions * Math.pow(1 - params.reductionRate, i);
    points.push({ year, bau, target });
  }
  return points;
}
```

---

#### 2.3 Export Functionality (PDF, Excel, JSON)

**Current State**: No export functionality exists

**Requirements from PRD:**
- PDF exports for investor-ready reports
- Excel exports for data analysis
- JSON exports for API integrations
- Framework-specific exports (GRI, SASB, TCFD)

**Technical Approach:**
- Server-side generation (edge functions)
- Libraries: `pdfkit` or `puppeteer` for PDF, `exceljs` for Excel
- Template-based report generation

**Files to create:**
- `supabase/functions/exports/pdf/index.ts`
- `supabase/functions/exports/excel/index.ts`
- `supabase/functions/exports/json/index.ts`
- `src/components/esg/ExportDialog.tsx`
- Report templates in `supabase/functions/exports/templates/`

**Dependencies:**
- Add export libraries to edge function dependencies
- Create report templates for each framework (GRI, SASB, TCFD)

---

#### 2.4 Benchmarking & Framework Mapping

**What's Missing:**
- ❌ Sector benchmark comparisons (via AlphaEarth)
- ❌ Framework mapping tables (GRI, SASB, TCFD standards)
- ❌ Indicator crosswalk (map ESG metrics to framework disclosures)
- ❌ Benchmark visualization in dashboard

**Additional Tables Needed:**
```sql
CREATE TABLE frameworks (
  code text PRIMARY KEY,          -- e.g., 'GRI', 'SASB', 'TCFD'
  name text NOT NULL,
  description text,
  version text,
  url text
);

CREATE TABLE framework_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_code text REFERENCES frameworks(code),
  disclosure_code text NOT NULL,  -- e.g., 'GRI 305-1'
  title text NOT NULL,
  description text,
  metric_mapping jsonb,           -- Maps to esg_indicators fields
  UNIQUE(framework_code, disclosure_code)
);

CREATE TABLE framework_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  framework_code text REFERENCES frameworks(code),
  reporting_year integer NOT NULL,
  content jsonb NOT NULL,         -- Structured report data
  status text DEFAULT 'draft',    -- draft, submitted, published
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Files to create:**
- Migration: `20250000000000_framework_mapping.sql`
- Seed data: GRI, SASB, TCFD standards
- `src/components/esg/BenchmarkComparison.tsx`
- `src/components/esg/FrameworkSelector.tsx`
- `src/components/esg/DisclosureMapper.tsx`

---

### 🟢 **LOW PRIORITY - Phase 3: Advanced Features (Q3-Q4 2025)**

#### 3.1 Multi-Year Climate Risk Projections
- Financial impact modeling
- Climate scenario analysis (1.5°C, 2°C, 3°C pathways)
- Physical risk assessment
- Transition risk modeling

#### 3.2 External Integrations
- Odoo ERP connector
- Utility API for meter readings
- SAP SFTP ingestion
- Climatiq emission factor API

#### 3.3 Assurance Workflow
- Third-party verification requests
- Evidence attachment system
- Assurance status tracking
- Verifier portal

---

## 3. Integration Strategy - SDG ↔ ESG Coexistence

### Architecture Decision: Modular Separation

**Principle**: SDG and ESG modules share auth, billing, and org infrastructure but remain functionally independent.

### Shared Infrastructure

1. **Authentication & Authorization**
   - Both modules use same `user_roles` and `profiles` tables
   - RLS policies isolate org-scoped data
   - No conflicts - already working ✅

2. **Organizations & Billing**
   - Both modules reference `organizations` table
   - ESG gated by `esg_enabled` boolean flag
   - Plan limits apply to both SDG projects and ESG reports
   - Unified billing via Flutterwave/Paystack
   - No conflicts - use different metrics ✅

3. **Audit Trail**
   - SDG uses generic `verification_logs` (public-facing)
   - ESG uses `esg_audit_logs` (compliance-focused, immutable)
   - No overlap - different purposes ✅

### Separated Data Domains

1. **SDG Tables** (Public-Facing)
   - `reports` - Project submissions
   - `change_makers` - Individual profiles
   - `fundraising_campaigns` - Crowdfunding
   - `sdg_agenda2063_alignment` - AU Agenda 2063 mapping

2. **ESG Tables** (Corporate Compliance)
   - `esg_indicators` - Corporate ESG metrics
   - `esg_suppliers` - Supply chain
   - `esg_supplier_emissions` - Scope 3
   - `esg_scenarios` - Risk modeling
   - `esg_audit_logs` - Compliance trail

### UI/UX Integration Points

**Option A: Separate Modules (Recommended)**
```
Navigation:
├── Dashboard (SDG Overview)
├── Submit Report (SDG)
├── Change Makers (SDG)
├── Fundraising (SDG)
├── ESG Dashboard (New)
│   ├── Indicators
│   ├── Suppliers
│   ├── Scenarios
│   └── Reports
└── Settings
```

**Option B: Unified Reporting Dashboard**
- Single "Sustainability Dashboard"
- Tabs for SDG Projects vs ESG Compliance
- Risk: UI complexity, user confusion

**Recommendation**: Use **Option A** with clear visual distinction:
- SDG = Public-facing, map-based, community-driven (teal, green)
- ESG = Corporate compliance, data-driven, investor-ready (blue, gray)

---

## 4. Implementation Roadmap

### Sprint 1: Security & Foundation (Week 1-2)
**Priority: CRITICAL**

1. **Security Fixes**
   - [ ] Create `alphaearth-benchmark` edge function
   - [ ] Move AlphaEarth API key to Supabase secrets
   - [ ] Update client code to call edge function
   - [ ] Implement Flutterwave signature verification
   - [ ] Test end-to-end with real API calls

2. **Plan Limits System**
   - [ ] Create migration for feature flags tables
   - [ ] Implement database functions (can_create_esg_report, etc.)
   - [ ] Seed initial plan limits
   - [ ] Create useCanCreateESG hook
   - [ ] Build UpgradeCTA component
   - [ ] Test usage enforcement

**Deliverable**: Secure, usage-limited ESG module foundation

---

### Sprint 2: CSV Upload & Processing (Week 3-4)
**Priority: HIGH**

1. **Supplier CSV Endpoints**
   - [ ] Create template download edge function
   - [ ] Create CSV upload edge function with validation
   - [ ] Create manual supplier entry endpoint
   - [ ] Add CSV parsing logic
   - [ ] Integrate with AlphaEarth enrichment
   - [ ] Test bulk import (100+ suppliers)

2. **UI Enhancements**
   - [ ] Add template download button to existing SupplierCSVImporter
   - [ ] Improve CSV preview functionality
   - [ ] Add progress indicators for bulk import
   - [ ] Show enrichment status per supplier

**Deliverable**: Complete Scope 3 intake workflow

---

### Sprint 3: Scenario Analysis (Week 5-6)
**Priority: MEDIUM**

1. **Scenario Engine**
   - [ ] Create scenarios edge function (CRUD)
   - [ ] Implement projection algorithm
   - [ ] Build ScenarioAnalysis component
   - [ ] Build ScenarioForm with parameter inputs
   - [ ] Build ScenarioChart (BAU vs Target)
   - [ ] Add scenario comparison view

2. **Integration**
   - [ ] Connect to existing ESG dashboard
   - [ ] Add "Scenarios" tab functionality
   - [ ] Test multi-scenario management

**Deliverable**: Working scenario analysis module

---

### Sprint 4: Exports & Reporting (Week 7-8)
**Priority: MEDIUM**

1. **Export Functionality**
   - [ ] Create PDF export edge function
   - [ ] Create Excel export edge function
   - [ ] Create JSON export endpoint
   - [ ] Build ExportDialog component
   - [ ] Create report templates

2. **Framework Mapping (Basic)**
   - [ ] Create frameworks migration
   - [ ] Seed GRI standards
   - [ ] Build basic framework mapping UI
   - [ ] Test GRI report generation

**Deliverable**: Investor-ready exports

---

### Sprint 5: SEO & Performance (Week 9-10)
**Priority: MEDIUM**

1. **Meta Tags & SEO**
   - [ ] Add comprehensive meta tags to index.html
   - [ ] Create robots.txt and sitemap.xml
   - [ ] Add favicon and app icons
   - [ ] Implement JSON-LD structured data
   - [ ] Test with Google Search Console

2. **Performance Optimization**
   - [ ] Lazy load map components
   - [ ] Optimize images (WebP, lazy loading)
   - [ ] Code splitting for ESG module
   - [ ] Measure Core Web Vitals

**Deliverable**: SEO-optimized, performant platform

---

### Sprint 6: Advanced Features (Week 11-12)
**Priority: LOW**

1. **Benchmarking**
   - [ ] Build benchmark comparison component
   - [ ] Add sector averages visualization
   - [ ] Integrate with AlphaEarth data

2. **Polish**
   - [ ] User onboarding flows
   - [ ] Contextual help tooltips
   - [ ] Error handling improvements
   - [ ] Mobile responsiveness review

**Deliverable**: Production-ready full product

---

## 5. File Structure - New Files to Create

```
DevMapper/
├── supabase/
│   ├── functions/
│   │   ├── alphaearth-benchmark/
│   │   │   └── index.ts                    [NEW - CRITICAL]
│   │   ├── suppliers/
│   │   │   ├── template/index.ts           [NEW]
│   │   │   ├── upload/index.ts             [NEW]
│   │   │   └── manual/index.ts             [NEW]
│   │   ├── scenarios/
│   │   │   └── index.ts                    [NEW]
│   │   └── exports/
│   │       ├── pdf/index.ts                [NEW]
│   │       ├── excel/index.ts              [NEW]
│   │       └── templates/                  [NEW]
│   ├── migrations/
│   │   ├── 20250000_plan_limits.sql        [NEW]
│   │   ├── 20250000_frameworks.sql         [NEW]
│   │   └── 20250000_fix_flutterwave.sql    [NEW]
│   └── config.toml                         [UPDATE]
├── src/
│   ├── components/
│   │   └── esg/
│   │       ├── ESGDashboard.tsx            [EXISTS ✅]
│   │       ├── SupplierCSVImporter.tsx     [EXISTS ✅]
│   │       ├── UpgradeCTA.tsx              [NEW]
│   │       ├── PlanLimitIndicator.tsx      [NEW]
│   │       ├── ScenarioAnalysis.tsx        [NEW]
│   │       ├── ScenarioForm.tsx            [NEW]
│   │       ├── ScenarioChart.tsx           [NEW]
│   │       ├── ScenarioList.tsx            [NEW]
│   │       ├── ExportDialog.tsx            [NEW]
│   │       ├── BenchmarkComparison.tsx     [NEW]
│   │       ├── FrameworkSelector.tsx       [NEW]
│   │       └── DisclosureMapper.tsx        [NEW]
│   ├── hooks/
│   │   ├── useCanCreateESG.ts              [NEW]
│   │   └── usePlanLimits.ts                [NEW]
│   ├── lib/
│   │   ├── alphaearth.ts                   [EXISTS - NEEDS REFACTOR]
│   │   ├── alphaearth-client.ts            [NEW - Client wrapper]
│   │   ├── esg-audit.ts                    [EXISTS ✅]
│   │   ├── esg-exports.ts                  [NEW]
│   │   └── scenario-engine.ts              [NEW]
│   └── pages/
│       └── ESG.tsx                         [EXISTS ✅]
├── public/
│   ├── robots.txt                          [NEW]
│   ├── sitemap.xml                         [NEW]
│   ├── favicon.ico                         [NEW]
│   ├── apple-touch-icon.png                [NEW]
│   └── site.webmanifest                    [NEW]
└── IMPLEMENTATION_ANALYSIS.md              [THIS FILE]
```

---

## 6. Risk Assessment

### Technical Risks

1. **AlphaEarth API Rate Limits** (HIGH)
   - **Risk**: Free tier may have strict limits
   - **Mitigation**: Aggressive caching, batch requests, graceful degradation
   - **Status**: Cache layer already implemented ✅

2. **Edge Function Cold Starts** (MEDIUM)
   - **Risk**: CSV processing may timeout on large files
   - **Mitigation**: Stream processing, chunking, async jobs
   - **Status**: Not yet addressed

3. **React/Vite SSR Complexity** (MEDIUM)
   - **Risk**: Lovable uses Vite, not Next.js - SSR harder to implement
   - **Mitigation**: Focus on meta tag optimization, static HTML improvements
   - **Status**: Workaround needed

### Business Risks

1. **User Confusion Between SDG & ESG** (MEDIUM)
   - **Risk**: Users unsure which module to use
   - **Mitigation**: Clear navigation, onboarding, separate branding
   - **Status**: UI/UX design needed

2. **Plan Limit Enforcement Bugs** (HIGH)
   - **Risk**: Users bypass limits, revenue loss
   - **Mitigation**: Thorough testing, server-side enforcement
   - **Status**: Critical for monetization

---

## 7. Success Metrics

### Technical KPIs
- [ ] AlphaEarth API key not exposed in client bundles
- [ ] Page load time < 2s (LCP)
- [ ] CSV import success rate > 95%
- [ ] Zero plan limit bypass incidents
- [ ] Edge function cold start < 1s

### Business KPIs (from PRD)
- [ ] 500+ active organizations
- [ ] 5,000+ SDG projects tracked
- [ ] 5% paid conversion rate
- [ ] 20 avg suppliers per org
- [ ] 1,000+ report exports/month

---

## 8. Next Steps

### Immediate Actions (This Week)

1. **Fix AlphaEarth Security Issue**
   - Create edge function
   - Add API key to secrets
   - Test end-to-end

2. **Implement Plan Limits System**
   - Create migration
   - Add enforcement logic
   - Build upgrade CTAs

3. **Document Integration Points**
   - Define API contracts
   - Create developer guide
   - Set up monitoring

### Questions for Stakeholders

1. **AlphaEarth Commercial Plan**
   - Do we have API key for pro tier?
   - What are rate limits?
   - Pricing structure?

2. **Framework Priorities**
   - GRI, SASB, or TCFD first?
   - Need legal/compliance review?

3. **Export Requirements**
   - PDF template design?
   - Excel format specifications?
   - Branding requirements?

---

## Conclusion

The DevMapper platform has a **strong foundation** with ESG tables, basic UI, and audit trail already in place. The critical path forward is:

1. **Security first** - Fix AlphaEarth API exposure
2. **Monetization second** - Implement plan limits
3. **Feature completion third** - CSV endpoints, scenarios, exports

With focused 2-week sprints, we can achieve production-ready status in **12 weeks** with all PRD phase 1-2 features complete.

The modular architecture ensures SDG and ESG modules coexist without conflicts, maintaining data integrity and user experience clarity.
