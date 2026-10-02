// Evidence gatherers shared by Ndovu agents.
import type { Db } from "./db.ts";
import type { AgentContext } from "./agent-utils.ts";
import type { EvidenceSet } from "./evidence.ts";
import { keywordSearch, mergeHits, semanticSearch, type EntityHit } from "./intel.ts";
import { countryCodes, liveSearch, worldBankIndicators, type ImportedEntity } from "./connectors.ts";

const SOURCE_LABEL: Record<string, string> = {
  devmapper: "DevMapper", iati: "IATI", openalex: "OpenAlex", worldbank: "World Bank", eu_funding_tenders: "EU Funding & Tenders", hdx: "HDX", user: "DevMapper user",
};
const typeLabel = (t: string) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function addHits(ev: EvidenceSet, hits: EntityHit[]) {
  for (const h of hits) {
    ev.add({
      label: `${typeLabel(h.type)}: ${h.title}`,
      source: h.source === "derived" ? "devmapper" : h.source,
      kind: "record",
      entityType: h.type, entityId: h.id, path: h.path, url: h.sourceUrl ?? undefined,
      content: [h.title, h.countryCode && `country ${h.countryCode}`, h.snippet].filter(Boolean).join(" | "),
    });
  }
}

export function addImported(ev: EvidenceSet, imported: ImportedEntity[]) {
  for (const { type, id, row } of imported) {
    const attrs = Object.entries(row.attributes ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join("; ");
    ev.add({
      label: `${typeLabel(type)} (${SOURCE_LABEL[row.source] ?? row.source}): ${row.title}`,
      source: row.source, kind: "live",
      entityType: type, entityId: id, path: `/explore/${type}/${id}`, url: row.source_url ?? undefined,
      content: [row.title, row.published_at && `date ${row.published_at}`, attrs, row.summary].filter(Boolean).join(" | "),
    });
  }
}

/** The entity the user asked about (from the Explore page), plus its connections. */
export async function addAboutEntity(db: Db, ev: EvidenceSet, about: unknown) {
  if (typeof about !== "string" || !/^[a-z_]+:[\w.:-]{1,80}$/.test(about)) return;
  const [type, ...rest] = about.split(":");
  const id = rest.join(":");
  const { data: label } = await db.rpc("entity_label", { p_type: type, p_id: id });
  const title = Array.isArray(label) ? label[0]?.title : (label as { title?: string } | null)?.title;
  if (!title) return;
  const { data: entity } = await db.from("entities").select("summary, source, source_url, attributes, published_at").eq("id", id).maybeSingle();
  ev.add({
    label: `${typeLabel(type)} being asked about: ${title}`,
    source: entity?.source ?? "devmapper", kind: "record", entityType: type, entityId: id,
    path: type === "project" ? `/project/${id}` : `/explore/${type}/${id}`, url: entity?.source_url ?? undefined,
    content: JSON.stringify({ title, summary: entity?.summary, attributes: entity?.attributes, published: entity?.published_at }),
  });
  const { data: links } = await db.rpc("get_entity_links", { p_type: type, p_id: id, p_limit: 25 });
  for (const l of links ?? []) {
    ev.add({
      label: `Connection: ${title} ${l.direction === "out" ? "→" : "←"} ${l.relation.replace(/_/g, " ")} → ${l.other_title}`,
      source: l.source === "derived" ? "devmapper" : l.source, kind: "record",
      entityType: l.other_type, entityId: l.other_id, path: l.other_path, url: l.source_ref?.startsWith("http") ? l.source_ref : undefined,
      content: `${l.other_type} "${l.other_title}" is ${l.direction === "out" ? `${l.relation} target of` : `linked by ${l.relation} to`} ${title} (confidence ${l.confidence})`,
    });
  }
}

export async function addCountryIndicators(ev: EvidenceSet, iso3s: string[]) {
  await Promise.all(iso3s.slice(0, 2).map(async (iso3) => {
    const rows = (await worldBankIndicators(iso3)).filter((r) => r.value !== null);
    if (rows.length === 0) return;
    ev.add({
      label: `World Bank indicators: ${iso3}`, source: "worldbank", kind: "live", entityType: "country", entityId: iso3,
      path: `/explore/country/${iso3}`, url: `https://data.worldbank.org/country/${iso3}`,
      content: rows.map((r) => `${r.label}: ${r.value!.toLocaleString("en", { maximumFractionDigits: 2 })} (${r.year})`).join("; "),
    });
  }));
}

/** DevMapper records matching the plan's search terms (keyword + semantic). */
export async function addSearchResults(db: Db, ctx: AgentContext, ev: EvidenceSet, opts: { types?: string[]; perTerm?: number } = {}) {
  const terms = ctx.plan?.searchTerms?.length ? ctx.plan.searchTerms : [ctx.question];
  const country = ctx.plan?.countries?.[0];
  const seen = new Set<string>();
  for (const term of terms.slice(0, 3)) {
    const [kw, sem] = await Promise.all([
      keywordSearch(db, term, { types: opts.types, country, limit: opts.perTerm ?? 6 }).catch(() => []),
      semanticSearch(db, term, { types: opts.types, limit: 4 }).then((r) => r.hits, () => []),
    ]);
    const fresh = mergeHits(kw, sem, 0.3).filter((h) => !seen.has(`${h.type}:${h.id}`));
    fresh.forEach((h) => seen.add(`${h.type}:${h.id}`));
    addHits(ev, fresh);
  }
}

/** Searches the live sources for the plan's first search term and cites what it imports. */
export async function addLiveSources(ctx: AgentContext, ev: EvidenceSet) {
  const term = ctx.plan?.searchTerms?.[0] ?? ctx.question;
  const codes = await countryCodes(ctx.admin);
  const iso3 = ctx.plan?.countries?.[0] ?? null;
  const { imported, errors } = await liveSearch(ctx.admin, term, { iso3, iso2: codes.iso2(iso3), limit: 4 });
  addImported(ev, imported);
  if (Object.keys(errors).length) console.warn("[gather] live sources failed:", errors);
}

/** The intelligence agent's full evidence pass. */
export async function gatherIntelligence(db: Db, ctx: AgentContext, ev: EvidenceSet) {
  await addAboutEntity(db, ev, ctx.hints.about);
  await Promise.all([
    addSearchResults(db, ctx, ev, { types: ctx.plan?.entityTypes?.length ? ctx.plan.entityTypes : undefined }),
    addLiveSources(ctx, ev).catch((e) => console.warn("[gather] live search failed", e)),
    addCountryIndicators(ev, ctx.plan?.countries ?? []).catch(() => undefined),
  ]);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The project the user is looking at, from client hints (validated, then read under their RLS). */
export const projectIdOf = (ctx: AgentContext): string | null =>
  typeof ctx.hints.projectId === "string" && UUID.test(ctx.hints.projectId) ? ctx.hints.projectId : null;

const DOC_CHUNK = 850;
const DOC_MAX_CHUNKS = 12;
/** A document the user attached to their question, split into citeable passages. */
export function addUploadedDocument(ev: EvidenceSet, doc: unknown) {
  if (!doc || typeof doc !== "object") return;
  const { name, text } = doc as { name?: unknown; text?: unknown };
  if (typeof text !== "string" || !text.trim()) return;
  const title = typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : "Uploaded document";
  const clean = text.replace(/\s+\n/g, "\n").trim();
  const parts = Math.min(Math.ceil(clean.length / DOC_CHUNK), DOC_MAX_CHUNKS);
  for (let i = 0; i < parts; i++) {
    ev.add({
      label: `Your document "${title}"${parts > 1 ? `, part ${i + 1} of ${parts}` : ""}`,
      source: "user_upload", kind: "record",
      content: clean.slice(i * DOC_CHUNK, (i + 1) * DOC_CHUNK),
    });
  }
}
