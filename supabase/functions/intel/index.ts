import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../_shared/db.ts";
import { corsHeaders, jsonError } from "../_shared/agent-utils.ts";
import { indexEntity, keywordSearch, mergeHits, semanticSearch, type EntityHit } from "../_shared/intel.ts";
import { countryCodes, liveSearch } from "../_shared/connectors.ts";
import { isServiceRoleRequest } from "../_shared/serviceAuth.ts";

// Development-intelligence search and indexing.
//   search {q, types?, country?, semantic?, live?} - keyword hits across every entity type the
//          caller can see, plus semantically similar entities (unless semantic: false). With
//          live: true it also queries OpenAlex, World Bank, IATI and the EU funding portal,
//          imports what they return (with source + URL) and includes it.
//   index  {type, id} - (re)embed one entity the caller can see.
//   backfill {limit?} - service role only (nightly cron): embed entities that have no embedding yet.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);

  let body: { action?: unknown; q?: unknown; types?: unknown; country?: unknown; semantic?: unknown; live?: unknown; type?: unknown; id?: unknown; limit?: unknown } | null;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", 400); }
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const url = Deno.env.get("SUPABASE_URL")!;

  if (body?.action === "backfill") {
    if (!isServiceRoleRequest(authHeader)) return jsonError("Unauthorized", 401);
    const admin = createClient<Database>(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const limit = typeof body.limit === "number" ? Math.min(Math.max(body.limit, 1), 100) : 50;
    const { data: missing, error } = await admin.rpc("entities_missing_embeddings", { p_limit: limit });
    if (error) return jsonError(error.message, 500);
    let indexed = 0;
    const errors: string[] = [];
    // Sequential: keeps the embeddings gateway well under its rate limit.
    for (const m of missing ?? []) {
      const r = await indexEntity(admin, { type: m.entity_type, id: m.entity_id });
      if (r.ok) indexed++;
      else errors.push(`${m.entity_type}:${m.entity_id} ${r.error}`);
    }
    return json({ indexed, failed: errors.length, errors: errors.slice(0, 10), batchFull: (missing?.length ?? 0) === limit });
  }

  const userDb = createClient<Database>(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await userDb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!user) return jsonError("Unauthorized", 401);

  if (body?.action === "search") {
    const q = typeof body.q === "string" ? body.q.trim().slice(0, 300) : "";
    if (q.length < 2) return jsonError("q must be at least 2 characters", 400);
    const types = Array.isArray(body.types) ? body.types.filter((t): t is string => typeof t === "string") : undefined;
    const country = typeof body.country === "string" && body.country ? body.country : undefined;
    try {
      const live = body.live === true ? await runLive(q, country) : { hits: [] as EntityHit[], errors: {} };
      const [keyword, semantic] = await Promise.all([
        keywordSearch(userDb, q, { types, country, limit: 40 }),
        body.semantic === false || country ? Promise.resolve({ hits: [] }) : semanticSearch(userDb, q, { types, limit: 10 }),
      ]);
      // Live imports are now in entities, so keyword search usually finds them too; keep one row each.
      const seen = new Set([...keyword, ...semantic.hits].map((h) => `${h.type}:${h.id}`));
      const liveOnly = live.hits.filter((h) => !seen.has(`${h.type}:${h.id}`));
      return json({
        results: [...mergeHits(keyword, semantic.hits), ...liveOnly],
        semanticError: "error" in semantic ? semantic.error : undefined,
        liveErrors: Object.keys(live.errors).length ? live.errors : undefined,
      });
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Search failed", 500);
    }
  }

  if (body?.action === "index") {
    const { type, id } = body;
    if (typeof type !== "string" || typeof id !== "string") return jsonError("type and id are required", 400);
    const { data: visible } = await userDb.rpc("entity_visible", { p_type: type, p_id: id });
    if (!visible) return jsonError("Not found", 404);
    const admin = createClient<Database>(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const result = await indexEntity(admin, { type, id });
    return json(result, result.ok ? 200 : 502);
  }

  return jsonError("action must be 'search', 'index' or 'backfill'", 400);

  async function runLive(q: string, country: string | undefined): Promise<{ hits: EntityHit[]; errors: Record<string, string> }> {
    const admin = createClient<Database>(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const cacheKey = `live-search:${q.toLowerCase()}:${country ?? ""}`;
    const { data: recent } = await admin.from("alphaearth_cache").select("id").eq("cache_key", cacheKey)
      .eq("provider", "live_search").gt("expires_at", new Date().toISOString()).maybeSingle();
    if (recent) return { hits: [], errors: {} };   // ran within 24h; its imports are found by keyword search
    const codes = await countryCodes(admin);
    const iso3 = codes.iso3(country);
    const { imported, errors } = await liveSearch(admin, q, { iso3, iso2: codes.iso2(iso3), limit: 6 });
    await admin.from("alphaearth_cache").insert({
      cache_key: cacheKey, provider: "live_search", payload: { imported: imported.length, errors },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    return {
      hits: imported.map(({ type, id, row }) => ({
        type, id, title: row.title, snippet: row.summary ?? null, path: `/explore/${type}/${id}`, source: row.source,
        sourceUrl: row.source_url ?? null, countryCode: row.country_code ?? null, score: 0.5, match: "live" as const,
      })),
      errors,
    };
  }
});
