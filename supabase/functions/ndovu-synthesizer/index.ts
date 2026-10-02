import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database, Json } from "../_shared/db.ts";
import { corsHeaders, jsonError } from "../_shared/agent-utils.ts";
import { synthesize, type AgentAnswer } from "../_shared/evidence.ts";

// Merges the session's agent answers into one, primary agent first. Evidence is renumbered
// across agents and every claim keeps its citations.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);

  const supabaseAdmin = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return jsonError("Invalid token", 401);

  let body: { sessionId?: unknown } | null;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400); }
  const { sessionId } = body ?? {};
  if (typeof sessionId !== "string" || sessionId.length < 8) return jsonError("Invalid sessionId", 400);

  const { data: session } = await supabaseAdmin
    .from("ai_agent_sessions").select("id, user_id, agents_invoked, question").eq("id", sessionId).maybeSingle();
  if (!session || session.user_id !== user.id) return jsonError("Session not found or forbidden", 403);

  const { data: outputs } = await supabaseAdmin.from("ai_agent_outputs").select("agent_name, structured_output").eq("session_id", sessionId);
  if (!outputs || outputs.length === 0) return jsonError("No agent outputs found", 404);

  const order: string[] = Array.isArray(session.agents_invoked) ? session.agents_invoked : [];
  const rank = (name: string) => {
    const i = order.indexOf(name.replace(/_ai$/, "").replace(/_agent$/, ""));
    return i === -1 ? 999 : i;
  };
  const answers = outputs
    .sort((a, b) => rank(a.agent_name) - rank(b.agent_name))
    .map((o) => o.structured_output as unknown as AgentAnswer)
    .filter((a) => a && Array.isArray(a.evidence) && Array.isArray(a.keyInsights));
  if (answers.length === 0) return jsonError("Agent outputs are in an outdated format; ask the question again", 409);

  const synthesis = { ...synthesize(answers), question: session.question };

  await supabaseAdmin.from("ai_agent_sessions").update({
    synthesis_output: synthesis as unknown as Json,
    confidence_score: synthesis.overallConfidence,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);
  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: user.id, session_id: sessionId, agent_name: "synthesizer", action: "synthesis",
    output_summary: `${synthesis.summary.slice(0, 150)} [${synthesis.evidence.length} sources, ${synthesis.overallConfidence}% sourced]`,
  });

  return new Response(JSON.stringify(synthesis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
