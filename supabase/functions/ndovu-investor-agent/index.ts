import { handleAgent } from "../_shared/agent-utils.ts";
import { addSearchResults, projectIdOf } from "../_shared/gather.ts";

const SYSTEM_PROMPT = `You are the Investor AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: evaluate financial viability, ROI, and investment readiness of development projects.
You have access to: reports (cost field), project_financial_impact, carbon_assets, fundraising_campaigns, corporate_targets.

For every analysis:
1. Calculate or estimate ROI = (Savings + Revenue - Cost) / Cost × 100
2. Assess carbon credit portfolio value if applicable
3. Evaluate funding readiness (0-100 score)
4. Identify funding match: World Bank, AfDB, UNDP, GEF, climate funds
5. Flag investment risks: unverified claims, missing financials, timeline gaps

Never speculate beyond available data. State confidence level explicitly.`;

Deno.serve((req) => handleAgent(req, "investor_ai", SYSTEM_PROMPT, async (db, ctx, ev) => {
  const projectId = projectIdOf(ctx);
  if (projectId) {
    const { data: report } = await db.from("reports").select("id, title, description, cost, cost_currency, sdg_goal, project_status, country_code").eq("id", projectId).maybeSingle();
    if (report) ev.rows([report], { label: (r) => `Project: ${r.title}`, entityType: "project", id: (r) => r.id, path: (r) => `/project/${r.id}` });
  }
  const { data: assets } = await db.from("carbon_assets").select("id, methodology, credits_generated, credits_retired, reference_price_usd, estimated_value_usd, verification_status, issuance_date").limit(10);
  ev.rows(assets, { label: (a) => `Carbon asset: ${a.methodology ?? "unspecified methodology"}` });
  const { data: campaigns } = await db.from("fundraising_campaigns").select("id, title, target_amount, raised_amount, currency, status").limit(5);
  ev.rows(campaigns, { label: (c) => `Campaign: ${c.title}`, entityType: "campaign", id: (c) => c.id, path: () => "/fundraising" });
  await addSearchResults(db, ctx, ev, { types: ["programme", "funding_opportunity", "organization", "project"], perTerm: 4 });
}));
