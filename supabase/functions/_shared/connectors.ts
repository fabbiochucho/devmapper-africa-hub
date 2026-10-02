// Live development-data connectors. Each returns normalised rows for public.entities
// with full provenance (source, external id, original URL); importRows() stores them
// and links them, so anything found live becomes searchable and citable afterwards.
import type { Db, Json } from "./db.ts";

export interface ImportRow {
  entity_type: "organization" | "programme" | "research" | "funding_opportunity" | "policy" | "dataset";
  title: string;
  summary?: string | null;
  country_code?: string | null;   // ISO3
  source: string;                 // data_providers.provider_key
  external_id: string;
  source_url?: string | null;
  published_at?: string | null;   // YYYY-MM-DD
  attributes?: Record<string, Json | undefined>;
  /** Other entities this row connects to: (related.row) -[relation]-> (this row). */
  related?: { relation: string; row: ImportRow }[];
}

export interface CountryCodes {
  iso3: (code: string | null | undefined) => string | null;
  iso2: (code: string | null | undefined) => string | null;
}

let countryCache: Promise<{ two: Map<string, string>; three: Map<string, string> }> | null = null;

/** ISO2 <-> ISO3 for the countries DevMapper covers (from country_intelligence). */
export async function countryCodes(db: Db): Promise<CountryCodes> {
  countryCache ??= Promise.resolve(db.from("country_intelligence").select("country_code, iso2_code")).then(({ data }) => {
    const two = new Map<string, string>();
    const three = new Map<string, string>();
    for (const r of data ?? []) {
      if (r.iso2_code) {
        two.set(r.iso2_code.toUpperCase(), r.country_code);
        three.set(r.country_code.toUpperCase(), r.iso2_code.toUpperCase());
      }
    }
    return { two, three };
  });
  const { two, three } = await countryCache;
  return {
    iso3: (c) => {
      const u = c?.trim().toUpperCase();
      if (!u) return null;
      return u.length === 2 ? two.get(u) ?? null : u.length === 3 ? u : null;
    },
    iso2: (c) => {
      const u = c?.trim().toUpperCase();
      if (!u) return null;
      return u.length === 3 ? three.get(u) ?? null : u.length === 2 ? u : null;
    },
  };
}

const TIMEOUT_MS = 8000;
async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const resp = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "application/json", ...(init.headers ?? {}) } });
  if (!resp.ok) throw new Error(`${new URL(url).host} returned ${resp.status}`);
  return resp.json();
}

const clip = (s: unknown, n = 700) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : null);
const day = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);

// ------------------------------------------------------------------ OpenAlex
/** Rebuilds an abstract from OpenAlex's inverted index. */
export function abstractFromIndex(idx: unknown): string | null {
  if (!idx || typeof idx !== "object") return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(idx as Record<string, number[]>)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter(Boolean).join(" ") || null;
}

interface OpenAlexWork {
  id: string; doi?: string | null; display_name?: string; publication_date?: string; cited_by_count?: number;
  primary_location?: { landing_page_url?: string | null; source?: { display_name?: string } | null } | null;
  authorships?: { author?: { display_name?: string } }[];
  abstract_inverted_index?: Record<string, number[]> | null;
  open_access?: { is_oa?: boolean };
}

export async function openAlexWorks(q: string, opts: { iso2?: string | null; iso3?: string | null; limit?: number } = {}): Promise<ImportRow[]> {
  const params = new URLSearchParams({
    search: q,
    "per-page": String(opts.limit ?? 6),
    select: "id,doi,display_name,publication_date,cited_by_count,primary_location,authorships,abstract_inverted_index,open_access",
    mailto: "data@devmapper.africa",
  });
  if (opts.iso2) params.set("filter", `authorships.institutions.country_code:${opts.iso2}`);
  const json = await getJson(`https://api.openalex.org/works?${params}`) as { results?: OpenAlexWork[] };
  return (json.results ?? []).filter((w) => w.display_name).map((w) => ({
    entity_type: "research" as const,
    title: w.display_name!.slice(0, 500),
    summary: clip(abstractFromIndex(w.abstract_inverted_index)),
    country_code: opts.iso3 ?? null,
    source: "openalex",
    external_id: w.id.replace("https://openalex.org/", ""),
    source_url: w.doi || w.primary_location?.landing_page_url || w.id,
    published_at: day(w.publication_date),
    attributes: {
      authors: (w.authorships ?? []).slice(0, 5).map((a) => a.author?.display_name).filter((n): n is string => !!n).join(", ") || undefined,
      venue: w.primary_location?.source?.display_name ?? undefined,
      cited_by: w.cited_by_count ?? undefined,
      open_access: w.open_access?.is_oa ?? undefined,
    },
  }));
}

// ------------------------------------------------------- World Bank projects
interface WbProject {
  id: string; project_name?: string; countrycode?: string[] | string; countryshortname?: string;
  totalcommamt?: string; boardapprovaldate?: string; closingdate?: string; status?: string; url?: string;
  sector1?: { Name?: string }; project_abstract?: { cdata?: string } | string;
}

const WORLD_BANK_ORG: ImportRow = {
  entity_type: "organization", title: "World Bank", source: "worldbank", external_id: "org:worldbank",
  source_url: "https://www.worldbank.org", summary: "International development bank providing loans, grants and analysis.",
};

export async function worldBankProjects(q: string, opts: { iso2?: string | null; iso3?: string | null; limit?: number } = {}): Promise<ImportRow[]> {
  const params = new URLSearchParams({
    format: "json", qterm: q, rows: String(opts.limit ?? 6),
    fl: "id,project_name,countrycode,countryshortname,totalcommamt,boardapprovaldate,closingdate,status,url,sector1,project_abstract",
  });
  if (opts.iso2) params.set("countrycode_exact", opts.iso2);
  const json = await getJson(`https://search.worldbank.org/api/v2/projects?${params}`) as { projects?: Record<string, WbProject> };
  return Object.values(json.projects ?? {}).filter((p) => p.project_name).map((p) => {
    const amount = Number(String(p.totalcommamt ?? "").replace(/,/g, ""));
    const abstract = typeof p.project_abstract === "string" ? p.project_abstract : p.project_abstract?.cdata;
    return {
      entity_type: "programme" as const,
      title: p.project_name!.trim().replace(/\s+/g, " ").slice(0, 500),
      summary: clip(abstract),
      country_code: opts.iso3 ?? null,
      source: "worldbank",
      external_id: `project:${p.id}`,
      source_url: p.url ?? `https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}`,
      published_at: day(p.boardapprovaldate),
      attributes: {
        project_id: p.id,
        country: p.countryshortname ?? undefined,
        commitment_usd: Number.isFinite(amount) && amount > 0 ? amount : undefined,
        status: p.status ?? undefined,
        sector: p.sector1?.Name ?? undefined,
        closing_date: p.closingdate ?? undefined,
      },
      related: [{ relation: "funds", row: WORLD_BANK_ORG }],
    };
  });
}

// --------------------------------------------------------------- IATI
interface IatiDoc {
  iati_identifier?: string; title_narrative?: string[]; description_narrative?: string[];
  reporting_org_narrative?: string[]; reporting_org_ref?: string; recipient_country_code?: string[];
  activity_status_code?: string; activity_date_iso_date?: string[]; budget_value?: number[];
}

const IATI_STATUS: Record<string, string> = { "1": "Pipeline", "2": "Implementation", "3": "Finalisation", "4": "Closed", "5": "Cancelled", "6": "Suspended" };

/** Escapes a free-text query for Solr. */
export const solrTerms = (q: string) => q.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ").trim().split(/\s+/).filter((w) => w.length > 2).slice(0, 8);

export async function iatiActivities(q: string, opts: { iso2?: string | null; iso3?: string | null; apiKey: string; limit?: number }): Promise<ImportRow[]> {
  const terms = solrTerms(q);
  if (terms.length === 0) return [];
  const text = terms.map((t) => `"${t}"`).join(" AND ");
  const clauses = [`(title_narrative:(${text}) OR description_narrative:(${text}))`];
  if (opts.iso2) clauses.push(`recipient_country_code:${opts.iso2}`);
  const params = new URLSearchParams({
    q: clauses.join(" AND "), rows: String(opts.limit ?? 6), wt: "json",
    fl: "iati_identifier,title_narrative,description_narrative,reporting_org_narrative,reporting_org_ref,recipient_country_code,activity_status_code,activity_date_iso_date,budget_value",
  });
  const json = await getJson(`https://api.iatistandard.org/datastore/activity/select?${params}`, {
    headers: { "Ocp-Apim-Subscription-Key": opts.apiKey },
  }) as { response?: { docs?: IatiDoc[] } };
  return (json.response?.docs ?? []).filter((d) => d.iati_identifier && d.title_narrative?.[0]).map((d) => {
    const org = d.reporting_org_narrative?.[0];
    const budget = (d.budget_value ?? []).reduce((s, v) => s + (Number(v) || 0), 0);
    return {
      entity_type: "programme" as const,
      title: d.title_narrative![0].slice(0, 500),
      summary: clip(d.description_narrative?.[0]),
      country_code: opts.iso3 ?? null,
      source: "iati",
      external_id: d.iati_identifier!,
      source_url: `https://d-portal.org/ctrack.html#view=act&aid=${encodeURIComponent(d.iati_identifier!)}`,
      published_at: day(d.activity_date_iso_date?.[0]),
      attributes: {
        reporting_org: org ?? undefined,
        status: IATI_STATUS[d.activity_status_code ?? ""] ?? undefined,
        total_budget: budget > 0 ? budget : undefined,
        recipient_countries: d.recipient_country_code?.join(", ") ?? undefined,
      },
      related: org && d.reporting_org_ref
        ? [{ relation: "implements", row: { entity_type: "organization" as const, title: org.slice(0, 500), source: "iati", external_id: `org:${d.reporting_org_ref}`, source_url: `https://d-portal.org/ctrack.html#view=publisher&publisher=${encodeURIComponent(d.reporting_org_ref)}` } }]
        : [],
    };
  });
}

// ---------------------------------------------- EU Funding & Tenders portal
const STOPWORDS = new Set(["africa", "african", "the", "and", "for", "with", "projects", "project", "programme", "programmes"]);
interface EuResult { title?: string; summary?: string; url?: string; metadata?: Record<string, string[] | undefined> }

export async function euFundingCalls(q: string, opts: { limit?: number; now?: Date } = {}): Promise<ImportRow[]> {
  const form = new FormData();
  // type 1/2/8 = calls for proposals / topics; status 31094501/31094502 = forthcoming/open
  form.append("query", new Blob([JSON.stringify({ bool: { must: [
    { terms: { type: ["1", "2", "8"] } }, { terms: { status: ["31094501", "31094502"] } },
  ] } })], { type: "application/json" }));
  form.append("languages", new Blob([JSON.stringify(["en"])], { type: "application/json" }));
  form.append("sort", new Blob([JSON.stringify({ field: "sortStatus", order: "ASC" })], { type: "application/json" })); // open calls first
  const params = new URLSearchParams({ apiKey: "SEDIA", text: q, pageSize: "50", pageNumber: "1" });
  const json = await getJson(`https://api.tech.ec.europa.eu/search-api/prod/rest/search?${params}`, { method: "POST", body: form }) as { results?: EuResult[] };
  const now = (opts.now ?? new Date()).getTime();
  // The portal's text ranking is loose; keep calls that mention at least two significant query words (or all, if fewer).
  const words = solrTerms(q).map((w) => w.toLowerCase()).filter((w) => !STOPWORDS.has(w));
  return (json.results ?? []).flatMap((r): ImportRow[] => {
    const md = r.metadata ?? {};
    const id = md.identifier?.[0];
    const deadline = md.deadlineDate?.[0];
    if (!id || !deadline || new Date(deadline).getTime() < now) return [];   // only calls still open
    const text = `${md.title?.[0] ?? r.title ?? ""} ${r.summary ?? ""} ${md.description?.[0] ?? ""}`.toLowerCase();
    if (words.filter((w) => text.includes(w)).length < Math.min(2, words.length)) return [];
    return [{
      entity_type: "funding_opportunity",
      title: (md.title?.[0] ?? r.title ?? id).slice(0, 500),
      summary: clip(r.summary ?? md.description?.[0]),
      country_code: null,
      source: "eu_funding_tenders",
      external_id: `${id}:${deadline.slice(0, 10)}`, // one call id can carry several deadlines
      source_url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${encodeURIComponent(id)}`,
      published_at: day(md.startDate?.[0]),
      attributes: { deadline: deadline.slice(0, 10), call: md.callIdentifier?.[0], programme_period: md.programmePeriod?.[0] },
    }];
  }).slice(0, opts.limit ?? 6);
}

// -------------------------------------- Humanitarian Data Exchange (HDX)
interface HdxPackage {
  name: string; title?: string; notes?: string; metadata_modified?: string; dataset_date?: string; license_title?: string;
  organization?: { title?: string } | null; num_resources?: number;
}

/** Datasets on HDX (CKAN). Country filter uses HDX's ISO3 location groups. */
export async function hdxDatasets(q: string, opts: { iso3?: string | null; limit?: number } = {}): Promise<ImportRow[]> {
  const params = new URLSearchParams({ q, rows: String(opts.limit ?? 6) });
  if (opts.iso3) params.set("fq", `groups:${opts.iso3.toLowerCase()}`);
  const json = await getJson(`https://data.humdata.org/api/3/action/package_search?${params}`) as { result?: { results?: HdxPackage[] } };
  return (json.result?.results ?? []).filter((p) => p.title).map((p) => ({
    entity_type: "dataset" as const,
    title: p.title!.slice(0, 500),
    summary: clip(p.notes),
    country_code: opts.iso3 ?? null,
    source: "hdx",
    external_id: p.name,
    source_url: `https://data.humdata.org/dataset/${p.name}`,
    published_at: day(p.metadata_modified),
    attributes: {
      publisher: p.organization?.title ?? undefined,
      covers: p.dataset_date ?? undefined,
      licence: p.license_title ?? undefined,
      files: p.num_resources ?? undefined,
    },
  }));
}

// ------------------------------------------------- World Bank indicators
export const WB_INDICATORS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "GDP (current US$)",
  "NY.GDP.PCAP.CD": "GDP per capita (current US$)",
  "SP.POP.TOTL": "Population, total",
  "SI.POV.DDAY": "Poverty headcount ratio at $2.15/day (% of population)",
  "EN.GHG.CO2.PC.CE.AR5": "CO2 emissions excl. LULUCF (t CO2e per capita)",
};

export interface IndicatorResult { code: string; label: string; value: number | null; year: string | null }

/** Latest available value per indicator, 2015 onwards. Accepts ISO2 or ISO3. */
export async function worldBankIndicators(countryCode: string, indicators: Record<string, string> = WB_INDICATORS): Promise<IndicatorResult[]> {
  return Promise.all(Object.entries(indicators).map(async ([code, label]) => {
    try {
      const json = await getJson(`https://api.worldbank.org/v2/country/${countryCode}/indicator/${code}?format=json&date=2015:2025&per_page=20`);
      const rows: { value: number | null; date: string }[] = Array.isArray(json) ? json[1] ?? [] : [];
      const latest = rows.find((r) => r.value != null);
      return { code, label, value: latest?.value ?? null, year: latest?.date ?? null };
    } catch {
      return { code, label, value: null, year: null };
    }
  }));
}

// ------------------------------------------------------------------ import
export interface ImportedEntity { type: string; id: string; row: ImportRow }

async function upsertRow(admin: Db, r: ImportRow): Promise<string | null> {
  const { data, error } = await admin.from("entities").upsert({
    entity_type: r.entity_type, title: r.title, summary: r.summary ?? null, country_code: r.country_code ?? null,
    source: r.source, external_id: r.external_id, source_url: r.source_url ?? null, published_at: r.published_at ?? null,
    attributes: Object.fromEntries(Object.entries(r.attributes ?? {}).filter(([, v]) => v !== undefined)) as Json,
    fetched_at: new Date().toISOString(),
  }, { onConflict: "source,external_id" }).select("id").single();
  if (error) {
    console.error("[connectors] upsert failed", r.source, r.external_id, error.message);
    return null;
  }
  return data.id;
}

async function sameEntityElsewhere(admin: Db, r: ImportRow): Promise<string[]> {
  if (r.entity_type !== "programme" && r.entity_type !== "organization") return [];
  const pattern = r.title.replace(/[\\%_]/g, (c) => `\\${c}`); // exact, case-insensitive match
  let q = admin.from("entities").select("id").eq("entity_type", r.entity_type).neq("source", r.source).ilike("title", pattern).limit(5);
  q = r.country_code ? q.eq("country_code", r.country_code) : q.is("country_code", null);
  const { data } = await q;
  return (data ?? []).map((d) => d.id);
}

/** Stores rows (and their related rows) in entities and links them. Service-role client only. */
export async function importRows(admin: Db, rows: ImportRow[]): Promise<ImportedEntity[]> {
  const out: ImportedEntity[] = [];
  for (const r of rows) {
    const id = await upsertRow(admin, r);
    if (!id) continue;
    out.push({ type: r.entity_type, id, row: r });
    const links = [];
    if (r.country_code) links.push({ from_type: r.entity_type, from_id: id, to_type: "country", to_id: r.country_code, relation: "located_in" });
    // Conflict resolution: the same programme or organisation is often published by several
    // providers (e.g. a World Bank project also reported to IATI). Link exact title matches in
    // the same country instead of presenting them as unrelated records.
    for (const dup of await sameEntityElsewhere(admin, r)) {
      links.push({ from_type: r.entity_type, from_id: id, to_type: r.entity_type, to_id: dup, relation: "same_as" });
    }
    for (const rel of r.related ?? []) {
      const relId = await upsertRow(admin, rel.row);
      if (relId) links.push({ from_type: rel.row.entity_type, from_id: relId, to_type: r.entity_type, to_id: id, relation: rel.relation });
    }
    if (links.length) {
      await admin.from("entity_links").upsert(
        links.map((l) => ({ ...l, source: r.source, source_ref: r.source_url ?? null, confidence: 1, created_by: null })),
        { onConflict: "from_type,from_id,to_type,to_id,relation", ignoreDuplicates: true },
      );
    }
  }
  return out;
}

/**
 * Runs every live connector for a query, isolating failures (one slow or broken source never
 * blocks the others) and recording provider health.
 */
export async function liveSearch(
  admin: Db, q: string, opts: { iso2?: string | null; iso3?: string | null; limit?: number },
): Promise<{ imported: ImportedEntity[]; errors: Record<string, string> }> {
  const iatiKey = Deno.env.get("IATI_API_KEY");
  const jobs: [string, Promise<ImportRow[]>][] = [
    ["openalex", openAlexWorks(q, opts)],
    ["worldbank", worldBankProjects(q, opts)],
    ["eu_funding_tenders", euFundingCalls(q, { limit: opts.limit })],
    ["hdx", hdxDatasets(q, opts)],
  ];
  if (iatiKey) jobs.push(["iati", iatiActivities(q, { ...opts, apiKey: iatiKey })]);
  const settled = await Promise.allSettled(jobs.map(([, p]) => p));
  const errors: Record<string, string> = {};
  const rows: ImportRow[] = [];
  settled.forEach((s, i) => {
    const key = jobs[i][0];
    if (s.status === "fulfilled") rows.push(...s.value);
    else errors[key] = s.reason instanceof Error ? s.reason.message : String(s.reason);
    admin.rpc("record_provider_health", {
      p_provider_key: key, p_success: s.status === "fulfilled", p_error_message: errors[key] ?? "",
    }).then(() => {}, () => {});
  });
  return { imported: await importRows(admin, rows), errors };
}
