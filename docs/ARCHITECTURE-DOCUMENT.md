# DevMapper Architecture Document
## Version 2.0
### Date: 2026-03-30

---

## 1. Current Architecture (Implemented)

### Frontend
- **Framework:** React 18 (Vite + SWC)
- **Styling:** Tailwind CSS 3.4 + shadcn/ui components
- **State:** TanStack React Query + React Context (Auth, UserRole)
- **Routing:** React Router v6 with lazy loading
- **i18n:** i18next (EN, FR, AR, PT, SW)
- **Maps:** MapLibre GL + Leaflet + react-leaflet + heatmap layers
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation
- **PWA:** Service worker (shell caching), manifest.json, install prompt

### Backend (Supabase)
- **Database:** PostgreSQL with Row Level Security (RLS) on all tables
- **Auth:** Supabase Auth (Email/Password, Google, GitHub, OTP, hCaptcha)
- **Edge Functions:** 16 Deno-based functions for server-side logic
- **Storage:** Supabase Storage for evidence files, media uploads
- **Realtime:** Supabase Realtime subscriptions (forum posts)

### Edge Functions Inventory
| Function | Auth | Purpose |
|----------|------|---------|
| ai-copilot | JWT | Ndovu Akili AI chat (SSE streaming) |
| rule-engine | JWT | Deterministic compliance validation |
| compliance-check | Public | Scheduled compliance agent |
| validate-report | JWT | Report field validation |
| create-payment | Public | Flutterwave payment initiation |
| flutterwave-webhook | Public | Payment confirmation handler |
| paystack-webhook | Public | Paystack payment handler |
| exchange-rates | Public | Multi-currency rate fetching |
| gee-proxy | JWT | Google Earth Engine proxy |
| sentinel-proxy | JWT | Sentinel Hub satellite imagery |
| sdg-proxy | JWT | UN SDG API proxy |
| climatetrace-proxy | JWT | Climate TRACE emissions data |
| alphaearth-proxy | JWT | AlphaEarth environmental data |
| email-digest | Public | Scheduled email notifications |
| nominate-changemaker | JWT | ChangeMaker nomination workflow |
| organization-management | Public | Org CRUD operations |
| verify-admin | JWT | Admin role verification |
| reset-passwords | Public | Password reset flow |
| send-downgrade-email | Public | Plan downgrade notification |

### Database Schema (48+ tables)

**Core Tables:**
- `profiles` - User profiles with role, org, country
- `reports` - SDG-aligned project reports (central entity)
- `organizations` - Multi-tenant org management
- `evidence_items` - Evidence attached to reports
- `verification_records` - Verification audit trail

**Social/Community:**
- `forum_posts`, `forum_post_likes` - Community forum
- `conversations`, `conversation_participants`, `direct_messages` - Messaging
- `change_makers` - ChangeMaker profiles
- `fundraising_campaigns`, `campaign_donations` - Fundraising

**ESG/Carbon:**
- `esg_indicators` - Scope 1/2/3, water, waste, energy per org/year
- `esg_suppliers`, `esg_supplier_emissions` - Supply chain emissions
- `esg_scenarios` - Scenario analysis
- `esg_audit_logs` - ESG-specific audit trail
- `project_carbon_data` - Per-project emissions
- `project_decarbonisation` - Reduction strategies
- `project_circularity` - Material flows + circularity scores
- `carbon_assets` - Credit portfolio management
- `carbon_compliance` - Article 6 compliance
- `carbon_transfer_logs` - Ownership transfer history
- `project_financial_impact` - ROI and savings tracking

**Governance:**
- `country_intelligence` - 54-country regulatory data
- `government_projects` - Government-specific projects
- `admin_areas` - Administrative boundary hierarchy
- `citizen_project_feedback`, `feedback_votes` - Citizen engagement
- `certification_applications` - Certification workflow
- `corporate_targets` - Corporate SDG targets

**Platform:**
- `audit_logs` - Platform-wide audit trail
- `analytics_events` - Usage analytics
- `billing_events` - Payment/subscription events
- `feature_flags` - Plan-gated feature access
- `notification_preferences` - Per-user notification settings
- `notifications` - In-app notifications
- `admin_broadcasts` - Admin broadcast messages
- `cms_content`, `cms_sections` - CMS for landing pages
- `ai_conversations` - AI chat history per user
- `dashboard_stats` - Cached dashboard statistics
- `alphaearth_cache` - Cached satellite/environmental data

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React + Vite)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Dashboards│ │ Reports  │ │ Ndovu Akili AI   │ │
│  │ (per role)│ │ + Verify │ │ (Copilot)        │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└───────────────────────┬─────────────────────────┘
                        │ Supabase Client SDK
┌───────────────────────▼─────────────────────────┐
│              Supabase Platform                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │PostgreSQL│ │   Auth   │ │  Edge Functions  │ │
│  │ (RLS)    │ │ (JWT)    │ │  (16 functions)  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐                       │
│  │ Storage  │ │ Realtime │                       │
│  └──────────┘ └──────────┘                       │
└───────────────────────┬─────────────────────────┘
                        │ Edge Function Proxies
┌───────────────────────▼─────────────────────────┐
│              External APIs                       │
│  ┌────────┐ ┌──────────┐ ┌──────────┐           │
│  │  GEE   │ │ Sentinel │ │ Climate  │           │
│  │        │ │   Hub    │ │  TRACE   │           │
│  └────────┘ └──────────┘ └──────────┘           │
│  ┌────────┐ ┌──────────┐ ┌──────────┐           │
│  │AlphaEar│ │ UN SDG   │ │Flutterw. │           │
│  │  th    │ │   API    │ │/Paystack │           │
│  └────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────┘
```

---

## 3. Security Architecture

### Authentication
- Supabase Auth with JWT tokens (3600s expiry, refresh rotation)
- Social login: Google, GitHub
- hCaptcha on registration
- Password strength enforcement (Zod schema)
- Session timeout warning (configurable)

### Authorization
- Row Level Security (RLS) on ALL tables
- `has_role()` security definer function for admin checks
- `user_roles` table (separate from profiles) for role-based access
- Feature flags gated by plan type (Lite/Pro/Advanced/Enterprise)
- Profile SELECT policy: authenticated users can view all profiles (needed for social features)

### Data Protection
- Verification ledger with SHA-256 hash chaining (tamper detection)
- ESG audit logs for compliance trail
- Input validation via Zod schemas on all forms
- HTML escaping in report exports (XSS prevention)
- CORS headers on all Edge Functions

---

## 4. Verification Architecture (SPVF)

```
Report Submitted
    ↓
Level 1: Self-Report (automatic)
    ↓
Level 2: Community Validation (peer review + voting)
    ↓
Level 3: Partner Verification (org-level review)
    ↓
Level 4: Institutional Verification (audit-grade)
    ↓
Hash-Chain Ledger Entry (SHA-256, tamper-proof)
    ↓
Certification Issued (Bronze → Silver → Gold → Platinum)
```

---

## 5. Carbon Layer Architecture

```
Project Workspace Tabs:
├── Overview (existing core)
├── Carbon (Phase 1) — Scope 1/2/3 emissions tracking
├── Climate (Phase 2) — Decarbonisation planning + TCFD alignment
├── Circularity (Phase 2) — Material flows + waste diversion
├── Carbon Assets (Phase 3) — Credit portfolio + marketplace readiness
├── Compliance (Phase 4) — Article 6/ITMO tracking
└── Financial Impact (Phase 5) — ROI engine + carbon pricing
```

---

## 6. AI Architecture (Ndovu Akili AI)

```
User Input
    ↓
Context Selection (General | Compliance | Report Draft | Carbon)
    ↓
System Prompt (versioned, per-context)
    ↓
AI Gateway (SSE streaming)
    ↓
Response Validation (Rule Engine)
    ↓
Output + Confidence Score
    ↓
Conversation History (per-user, persisted)
```

---

## 7. Future Microservices Architecture (Aspirational)

When DevMapper scales beyond Supabase Edge Functions:

### Core Services
1. **API Gateway** — Auth, rate limiting, multi-tenant routing
2. **Actor & Core Data Service** — UAO, project management, report CRUD
3. **Regulatory Engine** — Deterministic compliance (NO AI), REM calculations
4. **Country Intelligence Service** — 54-country regulatory config + data

### AI Services
5. **AI Orchestration** — Agent management, prompt routing, output validation
6. **RAG Service** — pgvector embeddings, regulatory doc retrieval
7. **LLM Inference** — Provider abstraction (OpenAI/open-weight fallback)
8. **Multilingual Service** — Language detection + translation

### dMRV Services
9. **Evidence Service** — IoT ingestion (MQTT/API), satellite data integration
10. **Verification Engine** — Multi-source evidence correlation, confidence scoring
11. **Audit Ledger** — Hash-chain records, optional blockchain bridge

### Infrastructure Services
12. **Notification & Event Bus** — Alerts, triggers, scheduled automation
13. **Billing & Usage** — Subscriptions, quotas, API usage tracking
14. **Analytics & Reporting** — Aggregation, scheduled reports, data export

---

## 8. Deployment Architecture

```
Production:
├── Frontend → Lovable Hosting (CDN)
├── Backend → Supabase Cloud (managed PostgreSQL + Edge Functions)
├── AI → Lovable AI Gateway (SSE proxy)
├── DNS → devmapper.africa (custom domain)
└── Monitoring → Supabase Dashboard + web-vitals

Development:
├── Preview → Lovable preview URLs
├── CI → GitHub Actions (lint, test, build)
└── Migrations → Supabase CLI (version-controlled)
```

---

**Document Version:** 2.0
**Last Updated:** 2026-03-30
**Consolidates:** V1 Architecture + PRD V1-V9 + all strategic documents
