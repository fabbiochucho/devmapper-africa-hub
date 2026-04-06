import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const verifiedUserId = user.id;
  const body = await req.json();
  const { userMessage, userRole, contextData, expertMode } = body;

  // Re-derive organization server-side
  const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: membership } = await supabaseUser.from("organization_members").select("organization_id").eq("user_id", verifiedUserId).limit(1).maybeSingle();
  const trustedOrgId = membership?.organization_id;

  // Rate limiting
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabaseAdmin.from("ai_agent_sessions").select("*", { count: "exact", head: true }).eq("user_id", verifiedUserId).gte("created_at", today);

  const planLimits: Record<string, number> = { free: 3, lite: 5, pro: 25, advanced: 100, enterprise: Infinity };
  let planType = "lite";
  if (trustedOrgId) {
    const { data: org } = await supabaseUser.from("organizations").select("plan_type").eq("id", trustedOrgId).single();
    planType = org?.plan_type ?? "lite";
  }
  const limit = planLimits[planType] ?? 5;
  if ((count ?? 0) >= limit) {
    return new Response(JSON.stringify({ error: "Daily multi-agent analysis limit reached. Upgrade your plan for more analyses." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Intent classification
  const msg = userMessage.toLowerCase();
  const intentRules: [string[], string][] = [
    [["verify", "trust", "greenwash", "credib"], "verification"],
    [["roi", "invest", "return", "payback", "fund"], "investment"],
    [["gri", "csrd", "cdp", "ifrs", "gap", "compli", "regulat"], "compliance"],
    [["design", "develop", "plan", "methodology"], "project_design"],
    [["supplier", "scope 3", "supply chain", "vendor"], "scope3"],
    [["buy", "sell", "trade", "retire", "credit", "marketplace"], "carbon_trade"],
  ];

  let intent = "general";
  for (const [keywords, intentType] of intentRules) {
    if (keywords.some(k => msg.includes(k))) { intent = intentType; break; }
  }

  // Role-based defaults
  if (intent === "general") {
    if (userRole === "government_official") intent = "compliance";
    if (userRole === "company_representative") intent = "compliance";
  }

  const agentMap: Record<string, string[]> = {
    verification: ["verifier"],
    investment: ["investor"],
    compliance: ["regulator"],
    project_design: ["project"],
    scope3: ["supplier"],
    carbon_trade: ["trader"],
    general: ["verifier"], // fallback
  };

  const agentsToInvoke = agentMap[intent] || ["verifier"];

  // Create session
  const { data: session, error: sessionError } = await supabaseAdmin.from("ai_agent_sessions").insert({
    user_id: verifiedUserId,
    session_type: "multi_agent",
    intent,
    agents_invoked: agentsToInvoke,
  }).select("id").single();

  if (sessionError) {
    return new Response(JSON.stringify({ error: "Failed to create session" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Audit log
  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: verifiedUserId,
    session_id: session.id,
    agent_name: "orchestrator",
    action: "intent_classification",
    input_summary: userMessage.slice(0, 200),
    output_summary: `Intent: ${intent}, Agents: ${agentsToInvoke.join(",")}`,
  });

  const contextSummary = `${userRole}, ${intent} query${trustedOrgId ? `, org: ${trustedOrgId}` : ""}`;

  return new Response(JSON.stringify({
    sessionId: session.id,
    intent,
    agentsToInvoke,
    contextSummary,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
