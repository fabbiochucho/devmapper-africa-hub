import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../_shared/db.ts";
import { callLLM, corsHeaders, jsonError } from "../_shared/agent-utils.ts";
import { agentsFor, buildPlan, PLAN_PROMPT } from "../_shared/intent.ts";

// Routes a question to Ndovu agents. The question itself decides the route (an LLM plan,
// keyword rules if the model is unavailable); the user's role is only a tiebreak for
// questions too vague to classify. The question and plan are stored on the session so
// agents read them server-side.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const supabaseAdmin = createClient<Database>(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return jsonError("Invalid token", 401);

  let body: { userMessage?: unknown; userRole?: unknown } | null;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", 400); }
  const { userMessage, userRole } = body ?? {};
  if (typeof userMessage !== "string" || userMessage.length === 0 || userMessage.length > 4000) {
    return jsonError("userMessage must be a string of 1-4000 chars", 400);
  }
  const allowedRoles = new Set(["citizen_reporter", "change_maker", "ngo_representative", "company_representative", "government_official", "investor", "verifier", "admin", "platform_admin", "guest"]);
  const safeRole = typeof userRole === "string" && allowedRoles.has(userRole) ? userRole : "guest";

  const supabaseUser = createClient<Database>(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

  // Daily limit by plan: the organisation's plan, else the user's individual plan.
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabaseAdmin.from("ai_agent_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", today);
  const { data: planRow } = await supabaseUser.rpc("effective_plan", { p_user_id: user.id });
  const planType = typeof planRow === "string" ? planRow : "free";
  const planLimits: Record<string, number> = { free: 3, lite: 5, individual: 20, pro: 25, advanced: 100, enterprise: Infinity };
  const limit = planLimits[planType] ?? 3;
  if ((count ?? 0) >= limit) {
    return jsonError("Daily Ndovu Akili limit reached for your plan. Upgrade for more analyses.", 429);
  }

  const { text: planText } = await callLLM(PLAN_PROMPT, userMessage.slice(0, 2000), { maxTokens: 300 });
  const plan = buildPlan(planText || null, userMessage, safeRole);
  const agentsToInvoke = agentsFor(plan.intent);

  const { data: session, error: sessionError } = await supabaseAdmin.from("ai_agent_sessions").insert({
    user_id: user.id,
    session_type: "multi_agent",
    intent: plan.intent,
    agents_invoked: agentsToInvoke,
    question: userMessage,
    query_plan: plan as unknown as Database["public"]["Tables"]["ai_agent_sessions"]["Insert"]["query_plan"],
  }).select("id").single();
  if (sessionError) return jsonError("Failed to create session", 500);

  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: user.id,
    session_id: session.id,
    agent_name: "orchestrator",
    action: "intent_classification",
    input_summary: userMessage.slice(0, 200),
    output_summary: `Intent: ${plan.intent} (${plan.classifiedBy}), agents: ${agentsToInvoke.join(",")}, countries: ${plan.countries.join(",") || "-"}`,
  });

  return new Response(JSON.stringify({
    sessionId: session.id,
    intent: plan.intent,
    agentsToInvoke,
    plan,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
