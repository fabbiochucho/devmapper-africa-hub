import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lovable AI Gateway (correct endpoint + header + supported model)
async function callLLM(systemPrompt: string, userPrompt: string): Promise<{ text: string; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { text: "", error: "AI service not configured (LOVABLE_API_KEY missing)." };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
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
  if (!content) return { text: "", error: "AI gateway returned no content." };
  return { text: content };
}

function parseAgentOutput(raw: string, agentName: string, dataSources: string[]) {
  const sections = { summary: "", keyInsights: [] as string[], risks: [] as string[], recommendedActions: [] as string[] };
  const lines = raw.split("\n").filter(l => l.trim());
  let section = "summary";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("key insight")) { section = "insights"; continue; }
    if (lower.includes("risk")) { section = "risks"; continue; }
    if (lower.includes("recommend") || lower.includes("action")) { section = "actions"; continue; }

    const cleaned = line.replace(/^[-*•]\s*/, "").trim();
    if (!cleaned) continue;

    if (section === "summary") sections.summary += cleaned + " ";
    else if (section === "insights") sections.keyInsights.push(cleaned);
    else if (section === "risks") sections.risks.push(cleaned);
    else if (section === "actions") sections.recommendedActions.push(cleaned);
  }

  const confidenceScore = Math.min(100, Math.max(20, 50 + sections.keyInsights.length * 5 + (sections.summary.length > 100 ? 15 : 0)));

  return {
    agentName,
    summary: sections.summary.trim() || raw.slice(0, 300),
    keyInsights: sections.keyInsights.slice(0, 5),
    risks: sections.risks.slice(0, 5),
    recommendedActions: sections.recommendedActions.slice(0, 5),
    confidenceScore,
    dataSources,
    requiresHumanReview: confidenceScore < 60,
  };
}

async function handleAgent(
  req: Request,
  agentName: string,
  systemPrompt: string,
  dataFetcher: (supabase: any, context: any) => Promise<{ contextStr: string; dataSources: string[] }>
) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return jsonError("Invalid token", 401);

  const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  let body: any;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", 400); }

  const { sessionId, userMessage, contextData, expertMode } = body ?? {};

  // Validate inputs
  if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 64) {
    return jsonError("Invalid sessionId", 400);
  }
  if (typeof userMessage !== "string" || userMessage.length === 0 || userMessage.length > 4000) {
    return jsonError("userMessage must be 1-4000 chars", 400);
  }

  // CRITICAL: verify session belongs to this user (prevents cross-user data poisoning)
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from("ai_agent_sessions")
    .select("id, user_id, agents_invoked")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionErr || !session) return jsonError("Session not found", 404);
  if (session.user_id !== user.id) return jsonError("Forbidden: session does not belong to caller", 403);

  // Verify this agent was actually invoked by the orchestrator for this session
  const invoked: string[] = Array.isArray(session.agents_invoked) ? session.agents_invoked : [];
  const handle = agentName.replace(/_ai$/, "").replace(/_agent$/, "");
  if (invoked.length > 0 && !invoked.includes(handle)) {
    return jsonError(`Agent '${handle}' was not assigned to this session by the orchestrator`, 403);
  }

  const { contextStr, dataSources } = await dataFetcher(supabaseUser, { userId: user.id, ...(contextData ?? {}) });

  const modeNote = expertMode ? "Use technical terminology." : "Use plain, non-technical language.";
  const fullPrompt = `${systemPrompt}\n\n${modeNote}\n\nContext data:\n${contextStr}\n\nUser question: ${userMessage}`;

  const { text: rawOutput, error: llmError } = await callLLM(fullPrompt, userMessage);
  if (llmError) {
    await supabaseAdmin.from("ai_audit_log").insert({
      user_id: user.id,
      session_id: sessionId,
      agent_name: agentName,
      action: "llm_error",
      output_summary: llmError.slice(0, 200),
    });
    const status = llmError.startsWith("RATE_LIMIT") ? 429 : llmError.startsWith("CREDITS_EXHAUSTED") ? 402 : 502;
    return jsonError(llmError, status);
  }

  const output = parseAgentOutput(rawOutput, agentName, dataSources);

  await supabaseAdmin.from("ai_agent_outputs").insert({
    session_id: sessionId,
    agent_name: agentName,
    raw_output: rawOutput,
    structured_output: output,
    confidence_score: output.confidenceScore,
    data_sources: dataSources,
  });

  await supabaseAdmin.from("ai_audit_log").insert({
    user_id: user.id,
    session_id: sessionId,
    agent_name: agentName,
    action: "analysis",
    input_summary: userMessage.slice(0, 200),
    output_summary: output.summary.slice(0, 200),
  });

  return new Response(JSON.stringify(output), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export { handleAgent, callLLM, parseAgentOutput, corsHeaders, jsonError };
