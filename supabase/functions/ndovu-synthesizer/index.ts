import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const body = await req.json();
  const { sessionId } = body;

  // Fetch all agent outputs scoped to session AND user
  const { data: outputs } = await supabaseAdmin
    .from("ai_agent_outputs")
    .select("*, ai_agent_sessions!inner(user_id)")
    .eq("session_id", sessionId)
    .eq("ai_agent_sessions.user_id", user.id);

  if (!outputs || outputs.length === 0) {
    return new Response(JSON.stringify({ error: "No agent outputs found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Merge outputs
  const allInsights: string[] = [];
  const allRisks: string[] = [];
  const allActions: string[] = [];
  const contributions: { agentName: string; mainContribution: string }[] = [];
  let totalConfidence = 0;
  let requiresHumanApproval = false;

  for (const output of outputs) {
    const so = output.structured_output || {};
    if (so.keyInsights) allInsights.push(...so.keyInsights);
    if (so.risks) allRisks.push(...so.risks);
    if (so.recommendedActions) allActions.push(...so.recommendedActions);
    if (so.requiresHumanReview) requiresHumanApproval = true;
    totalConfidence += so.confidenceScore || 50;
    contributions.push({
      agentName: output.agent_name,
      mainContribution: so.summary || "Analysis provided",
    });
  }

  // Deduplicate
  const unique = (arr: string[]) => [...new Set(arr)].slice(0, 5);

  const overallConfidence = Math.round(totalConfidence / outputs.length);
  const summaryParts = contributions.map(c => c.mainContribution).filter(Boolean);

  const synthesis = {
    summary: summaryParts.join(" ").slice(0, 500),
    keyInsights: unique(allInsights),
    risks: unique(allRisks),
    recommendedActions: unique(allActions),
    agentContributions: contributions,
    overallConfidence,
    requiresHumanApproval: requiresHumanApproval || overallConfidence < 60,
    disclaimer: "AI-generated guidance. Not legal or financial advice.",
  };

  // Update session
  await supabaseAdmin.from("ai_agent_sessions").update({
    synthesis_output: synthesis,
    confidence_score: overallConfidence,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  // Audit
  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: user.id,
    session_id: sessionId,
    agent_name: "synthesizer",
    action: "synthesis",
    output_summary: synthesis.summary.slice(0, 200),
  });

  return new Response(JSON.stringify(synthesis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
