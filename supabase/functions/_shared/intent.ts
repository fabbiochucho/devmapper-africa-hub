// Routing a Ndovu Akili question to agents: classify the question itself (LLM plan,
// keyword rules as fallback) and use the user's role only when the question is ambiguous.

export const INTENTS = ["discovery", "verification", "investment", "compliance", "project_design", "scope3", "carbon_trade"] as const;
export type Intent = typeof INTENTS[number];

export interface QueryPlan {
  intent: Intent;
  searchTerms: string[];      // short keyword queries for search_entities / live sources
  countries: string[];        // ISO3
  entityTypes: string[];      // what the user is looking for, if stated
  classifiedBy: "llm" | "keywords" | "role" | "default";
}

// Primary agent first. "intelligence" grounds every answer in DevMapper + live sources.
const AGENTS: Record<Intent, string[]> = {
  discovery: ["intelligence"],
  verification: ["verifier", "intelligence"],
  investment: ["investor", "intelligence", "verifier"],
  compliance: ["regulator", "intelligence"],
  project_design: ["project_developer", "intelligence", "regulator"],
  scope3: ["supplier", "verifier"],
  carbon_trade: ["carbon_trader", "verifier", "regulator"],
};
export const agentsFor = (intent: Intent) => AGENTS[intent];

const KEYWORD_RULES: [string[], Intent][] = [
  [["greenwash", "credib", "trust score", "verify", "verification"], "verification"],
  [["scope 3", "supply chain", "supplier", "vendor"], "scope3"],
  [["buy credit", "sell credit", "carbon credit", "retire", "marketplace", "offset price"], "carbon_trade"],
  [["roi", "payback", "invest in", "return on"], "investment"],
  [["gri", "csrd", "cdp", "ifrs", "tcfd", "gap analysis", "compliance", "comply", "disclosure requirement"], "compliance"],
  [["design my project", "methodology", "baseline", "project plan"], "project_design"],
];

export function keywordIntent(question: string): Intent | null {
  const q = question.toLowerCase();
  for (const [words, intent] of KEYWORD_RULES) if (words.some((w) => q.includes(w))) return intent;
  return null;
}

const ROLE_DEFAULTS: Record<string, Intent> = {
  government_official: "compliance", company_representative: "compliance", investor: "investment", verifier: "verification",
};

export const PLAN_PROMPT = `You route questions for a development-intelligence platform covering Africa.
Return ONLY JSON: {"intent": one of ${INTENTS.map((i) => `"${i}"`).join(", ")} or "unclear",
"searchTerms": up to 3 short keyword phrases (2-4 words each) to search databases with,
"countries": ISO 3166-1 alpha-3 codes of countries mentioned or clearly implied (e.g. "Northern Nigeria" -> "NGA"),
"entityTypes": any of "project","organization","policy","programme","research","funding_opportunity","dataset","indicator" the user is asking for}.
"discovery" = finding/understanding organisations, projects, programmes, policies, research, funding, gaps or evidence on a development topic.`;

const uniq = (xs: string[]) => [...new Set(xs)];

const STOP = new Set(("a an and are about any can could do does for from have how i in is it me my of on or our please show " +
  "tell that the their there these this to us we what when where which who why with work works working " +
  "organisations organizations projects programmes programs exist existing").split(" "));

/** The topical words of a question, for keyword search when no model plan is available. */
export const topicWords = (q: string) =>
  q.replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter((w) => w && !STOP.has(w.toLowerCase())).slice(0, 6).join(" ");

/** Builds a plan from the model's JSON, falling back to keyword rules, then role, then discovery. */
export function buildPlan(raw: string | null, question: string, role: string): QueryPlan {
  let obj: Record<string, unknown> = {};
  if (raw) {
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    if (s >= 0 && e > s) { try { obj = JSON.parse(raw.slice(s, e + 1)); } catch { obj = {}; } }
  }
  const strings = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim()).slice(0, max) : []);
  const searchTerms = uniq(strings(obj.searchTerms, 3).map((t) => t.slice(0, 60)));
  const countries = uniq(strings(obj.countries, 5).map((c) => c.toUpperCase()).filter((c) => /^[A-Z]{3}$/.test(c)));
  const entityTypes = strings(obj.entityTypes, 8);

  const llmIntent = INTENTS.find((i) => i === obj.intent);
  const kw = keywordIntent(question);
  let intent: Intent;
  let classifiedBy: QueryPlan["classifiedBy"];
  if (llmIntent) { intent = llmIntent; classifiedBy = "llm"; }
  else if (kw) { intent = kw; classifiedBy = "keywords"; }
  else if (obj.intent === "unclear" && ROLE_DEFAULTS[role]) { intent = ROLE_DEFAULTS[role]; classifiedBy = "role"; }
  else if (!raw && ROLE_DEFAULTS[role]) { intent = ROLE_DEFAULTS[role]; classifiedBy = "role"; }
  else { intent = "discovery"; classifiedBy = "default"; }

  return {
    intent,
    searchTerms: searchTerms.length ? searchTerms : [topicWords(question)],
    countries,
    entityTypes,
    classifiedBy,
  };
}
