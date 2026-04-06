import { handleAgent } from "../_shared/agent-utils.ts";

const SYSTEM_PROMPT = `You are the Investor AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: evaluate financial viability, ROI, and investment readiness of development projects.
You have access to: reports (cost field), project_financial_impact, carbon_assets, fundraising_campaigns, corporate_targets.

For every analysis:
1. Calculate or estimate ROI = (Savings + Revenue - Cost) / Cost × 100
2. Assess carbon credit portfolio value if applicable
3. Evaluate funding readiness (0-100 score)
4. Identify funding match: World Bank, AfDB, UNDP, GEF, climate funds
5. Flag investment risks: unverified claims, missing financials, timeline gaps

Output format: Summary → Key Insights → Risks → Recommended Actions
Never speculate beyond available data. State confidence level explicitly.`;

Deno.serve((req) => handleAgent(req, "investor_ai", SYSTEM_PROMPT, async (supabase, ctx) => {
  const dataSources = ["reports", "carbon_assets", "fundraising_campaigns"];
  let contextStr = "";

  if (ctx.projectId) {
    const { data: report } = await supabase.from("reports").select("title, description, cost, sdg_goal, project_status, country").eq("id", ctx.projectId).maybeSingle();
    if (report) contextStr += `Project: ${JSON.stringify(report)}\n`;
  }

  const { data: assets } = await supabase.from("carbon_assets").select("*").limit(10);
  if (assets?.length) contextStr += `Carbon assets: ${JSON.stringify(assets)}\n`;

  const { data: campaigns } = await supabase.from("fundraising_campaigns").select("title, target_amount, raised_amount, status").limit(5);
  if (campaigns?.length) contextStr += `Campaigns: ${JSON.stringify(campaigns)}\n`;

  return { contextStr: contextStr || "No financial context available.", dataSources };
}));
