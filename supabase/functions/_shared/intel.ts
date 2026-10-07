// Development-intelligence retrieval shared by search, embeddings and Ndovu agents.
// Every function takes the client whose permissions should apply: the caller's
// own client for reads (RLS decides what they see), the service-role client only
// for writing derived data (embeddings).
import type { Db } from "./db.ts";

export interface EntityRef {
  type: string;
  id: string;
}

export interface EntityHit extends EntityRef {
  title: string;
  snippet: string | null;
  path: string;
  source: string;
  sourceUrl: string | null;
  countryCode: string | null;
  score: number;
  match: "keyword" | "semantic" | "live";
}

export async function embedText(text: string): Promise<{ vector: number[] | null; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { vector: null, error: "AI service not configured (LOVABLE_API_KEY missing)." };
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return { vector: null, error: `Embeddings gateway error ${resp.status}: ${body.slice(0, 300)}` };
  }
  const data = await resp.json();
  const embedding = data?.data?.[0]?.embedding;
  return Array.isArray(embedding) ? { vector: embedding } : { vector: null, error: "Embeddings gateway returned no vector." };
}

/** The text an entity is embedded from, read with the service-role client. */
export async function entitySourceText(admin: Db, ref: EntityRef): Promise<string | null> {
  switch (ref.type) {
    case "project": {
      const { data: r } = await admin.from("reports").select("title, description, location").eq("id", ref.id).maybeSingle();
      return r && [r.title, r.location, r.description].filter(Boolean).join("\n\n");
    }
    case "framework": {
      const { data: r } = await admin.from("reporting_frameworks").select("name, code, category").eq("id", ref.id).maybeSingle();
      return r && [r.name, r.code, r.category?.replace(/_/g, " ")].filter(Boolean).join(" · ");
    }
    case "policy": {
      const { data: r } = await admin.from("regulatory_frameworks").select("name, regulator_name, category, country_code").eq("id", ref.id).maybeSingle();
      if (r) return [r.name, r.regulator_name, r.category?.replace(/_/g, " "), r.country_code].filter(Boolean).join(" · ");
      break;
    }
    case "organization": {
      const { data: r } = await admin.from("organizations").select("name, primary_sector").eq("id", ref.id).maybeSingle();
      if (r) return [r.name, r.primary_sector].filter(Boolean).join(" · ");
      break;
    }
  }
  const { data: e } = await admin.from("entities").select("title, summary, entity_type, country_code").eq("id", ref.id).maybeSingle();
  return e && [`${e.entity_type}: ${e.title}`, e.country_code, e.summary].filter(Boolean).join("\n\n");
}

export async function indexEntity(admin: Db, ref: EntityRef): Promise<{ ok: boolean; error?: string }> {
  const sourceText = await entitySourceText(admin, ref);
  if (!sourceText) return { ok: false, error: `${ref.type} ${ref.id} not found` };
  const { vector, error } = await embedText(sourceText);
  if (!vector) return { ok: false, error };
  const { error: upsertError } = await admin.from("entity_embeddings").upsert({
    entity_type: ref.type,
    entity_id: ref.id,
    embedding: JSON.stringify(vector), // pgvector accepts its text form
    source_text: sourceText.slice(0, 8000),
    updated_at: new Date().toISOString(),
  });
  return upsertError ? { ok: false, error: upsertError.message } : { ok: true };
}

export async function keywordSearch(
  db: Db, q: string, opts: { types?: string[]; country?: string; limit?: number } = {},
): Promise<EntityHit[]> {
  const { data, error } = await db.rpc("search_entities", {
    q, p_types: opts.types, p_country: opts.country, p_limit: opts.limit ?? 20,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((h) => ({
    type: h.entity_type, id: h.entity_id, title: h.title, snippet: h.snippet, path: h.path,
    source: h.source, sourceUrl: h.source_url, countryCode: h.country_code, score: h.rank, match: "keyword" as const,
  }));
}

export async function semanticSearch(
  db: Db, q: string, opts: { types?: string[]; limit?: number } = {},
): Promise<{ hits: EntityHit[]; error?: string }> {
  const { vector, error } = await embedText(q);
  if (!vector) return { hits: [], error };
  const { data, error: rpcError } = await db.rpc("match_entity_embeddings", {
    query_embedding: JSON.stringify(vector), match_count: opts.limit ?? 8, p_types: opts.types,
  });
  if (rpcError) return { hits: [], error: rpcError.message };
  return {
    hits: (data ?? []).map((m) => ({
      type: m.entity_type, id: m.entity_id, title: m.title, path: m.path,
      // source_text starts with the title; don't show it twice.
      snippet: m.source_text?.replace(`${m.title} · `, "").slice(0, 240) ?? null,
      source: "devmapper", sourceUrl: null, countryCode: null, score: m.similarity, match: "semantic" as const,
    })),
  };
}

/** Keyword + semantic results merged; an entity found both ways keeps the keyword row. */
export function mergeHits(keyword: EntityHit[], semantic: EntityHit[], minSimilarity = 0.25): EntityHit[] {
  const seen = new Set(keyword.map((h) => `${h.type}:${h.id}`));
  return [...keyword, ...semantic.filter((h) => h.score >= minSimilarity && !seen.has(`${h.type}:${h.id}`))];
}
