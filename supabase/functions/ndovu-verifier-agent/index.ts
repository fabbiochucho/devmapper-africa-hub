import { handleAgent } from "../_shared/agent-utils.ts";
import { addSearchResults, projectIdOf } from "../_shared/gather.ts";

const SYSTEM_PROMPT = `You are the Verifier AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: assess trust, credibility, and greenwashing risk for development projects.
You have access to: reports, verification_records, evidence_items, carbon_assets tables.

For every analysis:
1. Check verification tier reached (Self/Community/Partner/Institutional)
2. Assess evidence quality and completeness
3. Check for inconsistencies between claimed impact and evidence
4. Flag greenwashing risk indicators:
   - Carbon claims without verified methodology
   - Impact numbers disproportionate to project size
   - Missing evidence for key claims
   - No third-party verification for large claims
5. Calculate a credibility score (0-100)

Tone: precise, neutral, cite specific data points. Never invent data.`;

Deno.serve((req) => handleAgent(req, "verifier_ai", SYSTEM_PROMPT, async (db, ctx, ev) => {
  const projectId = projectIdOf(ctx);
  if (!projectId) {
    await addSearchResults(db, ctx, ev, { types: ["project", "evidence"], perTerm: 4 });
    return;
  }
  const { data: report } = await db.from("reports").select("id, title, description, location, country_code, sdg_goal, project_status, cost, cost_currency, beneficiaries, is_verified, verification_count, submitted_at").eq("id", projectId).maybeSingle();
  if (!report) return;
  ev.rows([report], { label: (r) => `Project report: ${r.title}`, entityType: "project", id: (r) => r.id, path: (r) => `/project/${r.id}` });
  const { data: items } = await db.from("evidence_items").select("id, title, description, evidence_type, verification_status, verification_stage, verified_at, file_url, created_at").eq("report_id", projectId).limit(15);
  ev.rows(items, { label: (e) => `Evidence: ${e.title} (${e.verification_status ?? "unreviewed"})`, path: () => `/project/${projectId}`, url: (e) => e.file_url ?? undefined, pick: ["title", "description", "evidence_type", "verification_status", "verification_stage", "verified_at", "created_at"] });
  const { data: logs } = await db.from("verification_logs").select("verification_type, comments, created_at").eq("report_id", projectId).order("created_at", { ascending: false }).limit(10);
  ev.rows(logs, { label: (l) => `Verification log: ${l.verification_type} on ${l.created_at.slice(0, 10)}`, path: () => `/project/${projectId}` });
  const { data: assets } = await db.from("carbon_assets").select("methodology, credits_generated, credits_retired, verification_status, issuance_date").eq("report_id", projectId);
  ev.rows(assets, { label: (a) => `Carbon asset for this project: ${a.methodology ?? "unspecified"}` });
}));
