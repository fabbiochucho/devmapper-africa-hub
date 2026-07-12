import { handleAgent, fetchSimilarReports } from "../_shared/agent-utils.ts";

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
    if (report) {
      contextStr += `Project: ${JSON.stringify(report)}\n`;

      // #53 RAG retrieval step: ground advice in semantically similar prior
      // reports (not just this one project), instead of only ever looking
      // up a single exact project_id. Best-effort - a missing/misconfigured
      // embeddings backend should never block the agent's core response.
      const { matches, error: ragError } = await fetchSimilarReports(
        supabase,
        `${report.title}\n\n${report.description}`,
        ctx.userId,
        5,
      );
      if (matches.length > 0) {
        const similarOthers = matches.filter((m) => m.report_id !== ctx.projectId);
        if (similarOthers.length > 0) {
          dataSources.push("report_embeddings");
          contextStr += `Similar prior projects (for reference/precedent, most similar first):\n${
            similarOthers.map((m) => `- "${m.title}" (similarity ${m.similarity.toFixed(2)}): ${m.description.slice(0, 200)}`).join("\n")
          }\n`;
        }
      } else if (ragError) {
        contextStr += `(Similar-project retrieval unavailable: ${ragError})\n`;
      }
    }
  }

  const { data: agenda } = await supabase.from("agenda2063_links").select("*").limit(20);
  contextStr += `Agenda 2063 links: ${JSON.stringify(agenda)}\n`;

  return { contextStr: contextStr || "No project context.", dataSources };
}));
