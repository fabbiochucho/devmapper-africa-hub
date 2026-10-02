import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database, Db, Json } from "./db.ts";
import { applyAgentRules } from "./agentRules.ts";
import { ANSWER_FORMAT, EvidenceSet, evidencePrompt, parseAnswer } from "./evidence.ts";
import type { QueryPlan } from "./intent.ts";
import { addUploadedDocument } from "./gather.ts";

/** What every agent's evidence gatherer receives. */
export interface AgentContext {
  userId: string;
  question: string;
  plan: QueryPlan | null;
  /** Client-supplied context (current page, projectId, about entity). Treated as untrusted hints. */
  hints: Record<string, unknown>;
  /** Service-role client, only for storing live-source imports. Never use it to read user data. */
  admin: Db;
}

/** Fills `evidence` with what the agent's answer may cite. Reads go through `db` (the caller's RLS). */
export type EvidenceGatherer = (db: Db, ctx: AgentContext, evidence: EvidenceSet) => Promise<void>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// §13 "must not fabricate, must show source": every agent prompt is built in one place
// (handleAgent), so this applies uniformly. ai-copilot reuses it.
const NON_FABRICATION_DIRECTIVE = `CRITICAL RULE: Never invent or estimate a specific number, date, regulation, organisation, or fact that isn't present in the evidence. If the evidence doesn't contain what's needed, say so plainly and list it under missingData rather than guessing. Every factual statement must cite the evidence ids it relies on.`;

// Lovable AI Gateway (OpenAI-compatible).
async function callLLM(
  systemPrompt: string, userPrompt: string, opts: { maxTokens?: number } = {},
): Promise<{ text: string; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { text: "", error: "AI service not configured (LOVABLE_API_KEY missing)." };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      max_tokens: opts.maxTokens ?? 2500,
    }),
  });
  if (resp.status === 429) return { text: "", error: "RATE_LIMIT: AI gateway rate limit exceeded. Try again in a moment." };
  if (resp.status === 402) return { text: "", error: "CREDITS_EXHAUSTED: AI credits exhausted. Add credits in Lovable workspace settings." };
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return { text: "", error: `AI gateway error ${resp.status}: ${body.slice(0, 200)}` };
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  return content ? { text: content } : { text: "", error: "AI gateway returned no content." };
}

async function handleAgent(req: Request, agentName: string, systemPrompt: string, gather: EvidenceGatherer) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const supabaseAdmin = createClient<Database>(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return jsonError("Invalid token", 401);
  const supabaseUser = createClient<Database>(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

  let body: { sessionId?: unknown; contextData?: unknown; expertMode?: unknown } | null;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", 400); }
  const { sessionId, expertMode } = body ?? {};
  const hints = body?.contextData && typeof body.contextData === "object" ? body.contextData as Record<string, unknown> : {};
  if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 64) return jsonError("Invalid sessionId", 400);

  // The session (created by the orchestrator) must belong to the caller and name this agent.
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from("ai_agent_sessions").select("id, user_id, agents_invoked, question, query_plan").eq("id", sessionId).maybeSingle();
  if (sessionErr || !session) return jsonError("Session not found", 404);
  if (session.user_id !== user.id) return jsonError("Forbidden: session does not belong to caller", 403);
  const handle = agentName.replace(/_ai$/, "").replace(/_agent$/, "");
  const invoked: string[] = Array.isArray(session.agents_invoked) ? session.agents_invoked : [];
  if (!invoked.includes(handle)) return jsonError(`Agent '${handle}' was not assigned to this session by the orchestrator`, 403);
  if (!session.question) return jsonError("Session has no question", 400);

  const evidence = new EvidenceSet();
  // A document the user attached comes first, so every agent can cite it.
  addUploadedDocument(evidence, hints.document);
  const ctx: AgentContext = {
    userId: user.id, question: session.question, plan: (session.query_plan as unknown as QueryPlan) ?? null, hints, admin: supabaseAdmin,
  };
  try {
    await gather(supabaseUser, ctx, evidence);
  } catch (e) {
    console.error(`[${agentName}] evidence gathering failed`, e);
  }

  const modeNote = expertMode === true ? "Use technical terminology." : "Use plain, non-technical language.";
  const prompt = `${systemPrompt}\n\n${NON_FABRICATION_DIRECTIVE}\n\n${modeNote}\n\n${ANSWER_FORMAT}`;
  const { text: raw, error: llmError } = await callLLM(prompt, `${evidencePrompt(evidence.list)}\n\nQUESTION: ${session.question}`);
  if (llmError) {
    await supabaseAdmin.from("ai_audit_log").insert({ user_id: user.id, session_id: sessionId, agent_name: agentName, action: "llm_error", output_summary: llmError.slice(0, 200) });
    const status = llmError.startsWith("RATE_LIMIT") ? 429 : llmError.startsWith("CREDITS_EXHAUSTED") ? 402 : 502;
    return jsonError(llmError, status);
  }

  const ruled = applyAgentRules(parseAnswer(raw, agentName, evidence.list));
  const output = ruled.output;
  if (!ruled.passed) {
    await supabaseAdmin.from("ai_audit_log").insert({
      user_id: user.id, session_id: sessionId, agent_name: agentName, action: "rule_violation", output_summary: `Violations: ${ruled.violations.join(", ")}`,
    });
  }

  await supabaseAdmin.from("ai_agent_outputs").insert({
    session_id: sessionId,
    agent_name: agentName,
    raw_output: raw,
    structured_output: output as unknown as Json,
    confidence_score: output.confidenceScore,
    data_sources: [...new Set(output.evidence.map((e) => e.source))],
  });
  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: user.id, session_id: sessionId, agent_name: agentName, action: "analysis",
    input_summary: session.question.slice(0, 200), output_summary: output.summary.slice(0, 200),
  });

  return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

export { handleAgent, callLLM, corsHeaders, jsonError, NON_FABRICATION_DIRECTIVE };
