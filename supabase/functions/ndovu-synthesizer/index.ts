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

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  const { sessionId } = body ?? {};
  if (typeof sessionId !== "string" || sessionId.length < 8) {
    return new Response(JSON.stringify({ error: "Invalid sessionId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Verify session ownership and pull invoked-agent order for weighting
  const { data: session } = await supabaseAdmin
    .from("ai_agent_sessions")
    .select("id, user_id, agents_invoked, intent")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Session not found or forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Fetch all agent outputs scoped to session
  const { data: outputs } = await supabaseAdmin
    .from("ai_agent_outputs")
    .select("*")
    .eq("session_id", sessionId);

  if (!outputs || outputs.length === 0) {
    return new Response(JSON.stringify({ error: "No agent outputs found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Order outputs by orchestrator-assigned agent priority (primary first)
  const order: string[] = Array.isArray(session.agents_invoked) ? session.agents_invoked : [];
  const priority = (name: string) => {
    const handle = name.replace(/_ai$/, "").replace(/_agent$/, "");
    const idx = order.indexOf(handle);
    return idx === -1 ? 999 : idx;
  };
  outputs.sort((a, b) => priority(a.agent_name) - priority(b.agent_name));

  // Merge outputs (primary agent's insights ranked first)
  const allInsights: string[] = [];
  const allRisks: string[] = [];
  const allActions: string[] = [];
  const contributions: { agentName: string; mainContribution: string; confidence: number }[] = [];
  let weightedConfidence = 0;
  let totalWeight = 0;
  let requiresHumanApproval = false;

  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    const so = (output.structured_output ?? {}) as Record<string, any>;
    if (Array.isArray(so.keyInsights)) allInsights.push(...so.keyInsights);
    if (Array.isArray(so.risks)) allRisks.push(...so.risks);
    if (Array.isArray(so.recommendedActions)) allActions.push(...so.recommendedActions);
    if (so.requiresHumanReview) requiresHumanApproval = true;
    // Primary agent (index 0) gets weight 2; supporting agents get weight 1
    const weight = i === 0 ? 2 : 1;
    weightedConfidence += (so.confidenceScore ?? 50) * weight;
    totalWeight += weight;
    contributions.push({
      agentName: output.agent_name,
      mainContribution: so.summary || "Analysis provided",
      confidence: so.confidenceScore ?? 50,
    });
  }

  // Deduplicate while preserving primary-agent priority
  const unique = (arr: string[]) => [...new Set(arr.map(s => s.trim()).filter(Boolean))].slice(0, 6);

  const overallConfidence = Math.round(weightedConfidence / Math.max(totalWeight, 1));
  const summaryParts = contributions.map(c => c.mainContribution).filter(Boolean);

  const synthesis = {
    summary: summaryParts.join(" ").slice(0, 600),
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
