# DevMapper AI Rules Document
## Version 2.0 — Strict Protocol
### Date: 2026-03-30

---

## 1. AI Brand Identity

| Attribute | Value |
|-----------|-------|
| Name | Ndovu Akili AI (Copilot) |
| Logo | Elephant with circuit-board pattern |
| Personality | Authoritative, Africa-context aware, structured, auditable |
| Interface | Floating panel, 4 context modes, streaming responses |

---

## 2. Non-Negotiable Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| LLM | OpenAI (via Lovable AI Gateway) | ✅ Implemented |
| Embeddings | text-embedding-3-large | 🔲 Future (RAG) |
| Vector DB | pgvector (Supabase extension) | 🔲 Future (RAG) |
| Backend AI | Supabase Edge Functions (Deno) | ✅ Implemented |
| Streaming | Server-Sent Events (SSE) | ✅ Implemented |
| History | ai_conversations table (per-user) | ✅ Implemented |

---

## 3. AI Responsibilities — ALLOWED

| # | Capability | Status | Description |
|---|-----------|--------|-------------|
| 1 | SDG Classification | ✅ | Auto-tag reports with SDG goals, sectors, categories |
| 2 | Report Summarization | ✅ | Executive briefs, donor-format summaries |
| 3 | Data Validation Hints | ✅ | Flag inconsistencies, suggest corrections |
| 4 | Compliance Gap Analysis | ✅ | Check against 6+ African regulatory frameworks |
| 5 | Donor Report Drafting | ✅ | World Bank, UNDP, AfDB, GEF format templates |
| 6 | Carbon Estimation | ✅ | Scope 1/2/3 calculation guidance |
| 7 | Climate Risk Analysis | ✅ | TCFD-aligned risk assessment |
| 8 | SDG/Agenda 2063 Mapping | ✅ | Cross-reference alignment |
| 9 | Similar Report Detection | 🔲 | Duplicate/near-duplicate via embeddings |
| 10 | Regulatory Retrieval (RAG) | 🔲 | Retrieve regulatory docs for context |

---

## 4. AI MUST NOT — Hard Constraints

1. **Make final verification decisions** — Human verifiers always have final authority
2. **Replace human verifiers** — AI assists, humans decide
3. **Generate fake data** — All outputs must be traceable to source data
4. **Act as autonomous agent** — No free-form agent behavior; structured prompts only
5. **Access data outside user's RLS scope** — Respect row-level security boundaries
6. **Store or log sensitive PII** — Conversation history excludes raw PII
7. **Execute actions without user confirmation** — AI suggests, user approves
8. **Provide legal/financial advice** — Clearly label all output as guidance, not advice

---

## 5. Context Modes (Implemented)

| Mode | System Prompt Focus | Available Quick Actions |
|------|-------------------|----------------------|
| General | Platform guidance, SDG knowledge, Africa context | SDG mapping, platform navigation |
| Compliance | Regulatory frameworks, IFRS S1/S2, country-specific rules | Gap analysis, framework comparison |
| Report Draft | Donor report templates (WB, UNDP, AfDB, GEF) | Template selection, section drafting |
| Carbon | Emissions calculation, TCFD, Article 6, carbon markets | Scope estimation, risk assessment |

---

## 6. Prompt Engineering Rules

### Temperature Settings
| Task Type | Temperature | Rationale |
|-----------|------------|-----------|
| Classification (SDG tagging) | ≤ 0.3 | Deterministic, repeatable |
| Compliance analysis | 0.3 | Structured, factual |
| Summarization | 0.5 | Some creativity for readability |
| Report drafting | 0.5-0.7 | Narrative quality needed |
| General chat | 0.7 | Conversational flexibility |

### Prompt Structure
```
[System Prompt - versioned, per-context]
    ↓
[User Context Injection]
  - User role (citizen/ngo/corporate/government)
  - Organization context (if applicable)
  - Country context (from country_intelligence)
  - Active project context (if in project workspace)
    ↓
[User Message]
    ↓
[Response Constraints]
  - Structured JSON for classification tasks
  - Markdown for narrative tasks
  - Always include confidence indicator
  - Always cite framework/standard when referencing compliance
```

### Prompt Versioning
- All system prompts stored in Edge Function code (version-controlled)
- Prompt changes require code review
- Each prompt includes version identifier
- Audit trail via git history

---

## 7. RAG Pipeline (Future — Priority 3)

### Architecture
```
Document Ingestion
    ↓
Chunking (500-1000 tokens per chunk)
    ↓
Embedding (text-embedding-3-large)
    ↓
Storage (pgvector in Supabase)
    ↓

User Query
    ↓
Query Embedding
    ↓
Similarity Search (cosine, top-k=5)
    ↓
Context Assembly
    ↓
LLM Generation (with retrieved context)
    ↓
Output Validation (Rule Engine)
```

### Document Corpus (Planned)
| Category | Examples |
|----------|---------|
| Regulatory | IFRS S1/S2, Nigeria SRG1, Kenya Climate Act, SA Carbon Tax Act |
| Frameworks | GRI Standards, TCFD Recommendations, SDG Indicators |
| Templates | Donor report formats, ESG report templates |
| Country Intel | Regulatory profiles for 54 African countries |
| Historical | Past verified reports (anonymized) for benchmarking |

### RAG Constraints
- Retrieved context always shown to user (transparency)
- Source attribution required on all RAG-enhanced responses
- Retrieval confidence score displayed
- Fallback to base knowledge when retrieval confidence < 0.5
- No hallucination of regulatory content — must cite source

---

## 8. AI Agent Types (Future — Priority 3)

| Agent | Purpose | Trigger | Status |
|-------|---------|---------|--------|
| Compliance Agent | Evaluate regulatory alignment per country | On report submission | ✅ Scheduled (weekly edge function) |
| Reporting Agent | Generate structured donor reports | On user request | ✅ Via Report Draft context mode |
| Monitoring Agent | Track project deviations from plan | Periodic (quarterly) | 🔲 Not implemented |
| Carbon Agent | Validate emissions data + suggest offsets | On carbon data entry | ✅ Via Carbon context mode |
| Classification Agent | Auto-tag SDG goals + sectors | On report creation | 🔲 Not implemented |

### Agent Constraints (Non-Negotiable)
1. Each agent has a defined scope — no cross-boundary data access
2. All agent outputs validated by Rule Engine before presentation
3. All agent actions logged in `audit_logs` table
4. Human override always available (one click)
5. Agent outputs include confidence score (0-100)
6. Low-confidence outputs (< 60) flagged for human review
7. No agent can modify data — only suggest modifications

---

## 9. Data Flow Governance

1. All AI inputs/outputs logged in `ai_conversations` table
2. AI confidence scores displayed to users in UI
3. Low-confidence outputs visually flagged (amber/red indicators)
4. AI model version tracked in system prompt metadata
5. Token usage monitored per organization plan (future: capped)
6. No AI processing of data outside user's organization scope
7. AI responses include disclaimer: "AI-generated guidance, not legal/financial advice"

---

## 10. Security Requirements

1. **Authentication:** AI endpoint requires valid JWT (user must be logged in)
2. **Rate Limiting:** Per-user request limits based on plan tier
3. **Input Sanitization:** User messages stripped of injection attempts
4. **Output Sanitization:** AI responses sanitized before rendering
5. **Audit Trail:** Every AI interaction logged with user_id, timestamp, context
6. **Data Isolation:** AI cannot access data across organization boundaries

---

**Document Version:** 2.0
**Last Updated:** 2026-03-30
**Consolidates:** V1 AI Rules + PRD V6 AI Layer + Devmapper_21032026_AI.txt
