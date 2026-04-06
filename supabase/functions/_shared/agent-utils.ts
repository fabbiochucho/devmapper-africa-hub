import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return "AI service not configured.";

  const resp = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      max_tokens: 2000,
    }),
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
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

async function handleAgent(req: Request, agentName: string, systemPrompt: string, dataFetcher: (supabase: any, context: any) => Promise<{ contextStr: string; dataSources: string[] }>) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } }
  });

  const body = await req.json();
  const { sessionId, userMessage, contextData, expertMode } = body;

  const { contextStr, dataSources } = await dataFetcher(supabaseUser, { userId: user.id, ...contextData });

  const modeNote = expertMode ? "Use technical terminology." : "Use plain, non-technical language.";
  const fullPrompt = `${systemPrompt}\n\n${modeNote}\n\nContext data:\n${contextStr}\n\nUser question: ${userMessage}`;

  const rawOutput = await callLLM(fullPrompt, userMessage);
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

export { handleAgent, callLLM, parseAgentOutput, corsHeaders };
