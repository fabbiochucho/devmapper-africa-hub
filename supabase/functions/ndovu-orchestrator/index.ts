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
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  const { userMessage, userRole, contextData, expertMode } = body ?? {};

  // Input validation
  if (typeof userMessage !== "string" || userMessage.length === 0 || userMessage.length > 4000) {
    return new Response(JSON.stringify({ error: "userMessage must be a string of 1-4000 chars" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const allowedRoles = new Set(["citizen_reporter", "change_maker", "ngo_representative", "company_representative", "government_official", "investor", "verifier", "admin", "platform_admin", "guest"]);
  const safeRole = allowedRoles.has(userRole) ? userRole : "guest";

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

  // Intent classification (most-specific rules first)
  const msg = userMessage.toLowerCase();
  const intentRules: [string[], string][] = [
    [["greenwash", "credib", "trust score", "verify", "verification"], "verification"],
    [["scope 3", "supply chain", "supplier", "vendor"], "scope3"],
    [["buy credit", "sell credit", "trade", "retire", "marketplace", "offset price"], "carbon_trade"],
    [["roi", "payback", "invest", "fund", "return on"], "investment"],
    [["gri", "csrd", "cdp", "ifrs", "tcfd", "gap analysis", "compli", "regulat", "framework"], "compliance"],
    [["design", "methodology", "baseline", "plan project", "project plan"], "project_design"],
  ];

  let intent = "general";
  for (const [keywords, intentType] of intentRules) {
    if (keywords.some(k => msg.includes(k))) { intent = intentType; break; }
  }

  // Role-based defaults
  if (intent === "general") {
    if (safeRole === "government_official" || safeRole === "company_representative") intent = "compliance";
    else if (safeRole === "investor") intent = "investment";
    else if (safeRole === "verifier") intent = "verification";
  }

  // Multi-agent handoffs: each intent invokes a primary + supporting agents.
  // Verifier is included in most flows because trust/credibility cross-cuts every decision.
  const agentMap: Record<string, string[]> = {
    verification: ["verifier"],
    investment: ["investor", "verifier"],                  // ROI claims need trust check
    compliance: ["regulator", "verifier"],                 // gap analysis grounded in evidence
    project_design: ["project_developer", "regulator", "verifier"],  // design must be compliant + verifiable
    scope3: ["supplier", "verifier"],                      // supplier data needs verification
    carbon_trade: ["carbon_trader", "verifier", "regulator"],     // credits need trust + regulatory standing
    general: ["verifier"],
  };

  const agentsToInvoke = agentMap[intent] ?? ["verifier"];

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
