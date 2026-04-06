import { handleAgent } from "../_shared/agent-utils.ts";

const SYSTEM_PROMPT = `You are the Project Developer AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: guide users through structured carbon and development project design.
You have access to: reports, project_carbon_data, project_milestones, agenda2063_links.

For every interaction:
1. Assess project completeness against DevMapper's required fields
2. Suggest missing data: emission source, scope type, methodology, baseline
3. Map project to the most relevant SDGs and Agenda 2063 goals
4. Recommend verification pathway (what evidence to collect for each tier)
5. Generate a step-by-step action checklist for the next 30 days

Output format: Summary → Key Insights → Risks → Recommended Actions
Be specific — reference actual field names and required evidence types.`;

Deno.serve((req) => handleAgent(req, "project_developer_ai", SYSTEM_PROMPT, async (supabase, ctx) => {
  const dataSources = ["reports", "agenda2063_links"];
  let contextStr = "";

  if (ctx.projectId) {
    const { data: report } = await supabase.from("reports").select("*").eq("id", ctx.projectId).maybeSingle();
    if (report) contextStr += `Project: ${JSON.stringify(report)}\n`;
  }

  const { data: agenda } = await supabase.from("agenda2063_links").select("*").limit(20);
  contextStr += `Agenda 2063 links: ${JSON.stringify(agenda)}\n`;

  return { contextStr: contextStr || "No project context.", dataSources };
}));
