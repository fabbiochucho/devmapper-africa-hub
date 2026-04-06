import { handleAgent } from "../_shared/agent-utils.ts";

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

Output format: Summary → Key Insights → Risks → Recommended Actions
Tone: precise, neutral, cite specific data points. Never invent data.`;

Deno.serve((req) => handleAgent(req, "verifier_ai", SYSTEM_PROMPT, async (supabase, ctx) => {
  const dataSources = ["reports", "verification_records", "evidence_items", "carbon_assets"];
  let contextStr = "";

  if (ctx.projectId) {
    const { data: report } = await supabase.from("reports").select("*").eq("id", ctx.projectId).maybeSingle();
    if (report) contextStr += `Report: ${JSON.stringify(report)}\n`;

    const { data: evidence } = await supabase.from("evidence_items").select("*").eq("report_id", ctx.projectId);
    contextStr += `Evidence items: ${evidence?.length || 0}\n${JSON.stringify(evidence?.slice(0, 5))}\n`;

    const { data: verifications } = await supabase.from("verification_records").select("*").eq("report_id", ctx.projectId).order("created_at", { ascending: false });
    contextStr += `Verifications: ${JSON.stringify(verifications?.slice(0, 5))}\n`;
  }

  return { contextStr: contextStr || "No project context provided.", dataSources };
}));
