import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonError, indexReportEmbedding, fetchSimilarReports } from "../_shared/agent-utils.ts";

// #53 RAG pipeline entry point. Two actions:
//   'index'  - embed and store a single report's title+description (called
//              best-effort right after a report is submitted).
//   'search' - embed a free-text query and return the top-K semantically
//              similar reports the caller can access (called by Ndovu
//              agent dataFetchers as a retrieval step).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return jsonError("Invalid token", 401);

  let body: any;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", 400); }

  const { action } = body ?? {};

  if (action === "index") {
    const { reportId } = body;
    if (typeof reportId !== "string") return jsonError("reportId is required", 400);
    const result = await indexReportEmbedding(supabaseAdmin, reportId);
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "search") {
    const { query, matchCount } = body;
    if (typeof query !== "string" || query.length === 0) return jsonError("query is required", 400);
    const result = await fetchSimilarReports(supabaseAdmin, query, user.id, typeof matchCount === "number" ? matchCount : 5);
    return new Response(JSON.stringify(result), {
      status: result.error ? 502 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return jsonError("action must be 'index' or 'search'", 400);
});
