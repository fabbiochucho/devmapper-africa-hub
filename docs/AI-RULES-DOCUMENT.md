# DevMapper AI Rules Document
## Version 1.0 — Strict Protocol
### Date: 2026-03-22

---

## Non-Negotiable Stack

| Component | Technology |
|-----------|-----------|
| LLM | OpenAI / open-weight fallback |
| Embeddings | text-embedding-3-large |
| Vector DB | Pinecone / Weaviate / pgvector |
| Backend AI | Python (FastAPI) or Supabase Edge Functions |

---

## AI Responsibilities ONLY

1. **Classification** — SDG goal, sector, category tagging
2. **Summarization** — Report summaries, executive briefs
3. **Data validation hints** — Flag inconsistencies, suggest corrections
4. **Similar report detection** — Duplicate and near-duplicate identification
5. **Structured compliance suggestions** — Based on RAG context

---

## AI MUST NOT

1. **Make final verification decisions** — Human verifiers always have final authority
2. **Replace human verifiers** — AI assists, humans decide
3. **Generate fake data** — All outputs must be traceable to source data
4. **Act as autonomous agent** — No free-form agent behavior
5. **Access sensitive user data without authorization** — Respect RLS boundaries

---

## AI Architecture Pattern

### Retrieval Augmented Generation (RAG)
```
User submits report
   ↓
AI preprocessing (normalization)
   ↓
SDG classification (structured prompt)
   ↓
Vector embedding (text-embedding-3-large)
   ↓
Similarity check (against existing reports)
   ↓
Flagging (optional, rule-based)
   ↓
Output validation (Rule Engine)
```

### Prompt Engineering Rules
- **Prompt templates ONLY** — No free-form agent prompts
- **Deterministic outputs where possible** — Structured JSON responses
- **Temperature ≤ 0.3** for classification tasks
- **Temperature 0.5-0.7** for summarization tasks
- **All prompts versioned and auditable**

---

## AI Agent Types (Future)

| Agent | Purpose | Trigger |
|-------|---------|---------|
| Compliance Agent | Evaluate regulatory alignment | On report submission |
| Reporting Agent | Generate structured reports | On user request |
| Monitoring Agent | Track project deviations | Periodic (quarterly) |
| Carbon Agent | Validate emissions data | On carbon data entry |

### Agent Constraints
- Each agent has a defined scope — no cross-boundary access
- Outputs always validated by Rule Engine before presentation
- All agent actions logged in audit trail
- Human override always available

---

## Data Flow Governance

1. All AI inputs/outputs logged in `audit_logs`
2. AI confidence scores displayed to users
3. Low-confidence outputs flagged for human review
4. AI model versions tracked for reproducibility
5. Token usage monitored and capped per organization plan

---

**Document Version:** 1.0
**Last Updated:** 2026-03-22
**Source Documents:** Devmapper_21032026B.txt
