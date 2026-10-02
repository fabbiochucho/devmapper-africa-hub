// Evidence and citations for Ndovu Akili answers.
//
// Agents gather Evidence (each a numbered record with where it came from), the model
// answers in JSON citing evidence ids, and parseAnswer() keeps only citations that
// exist. A claim with no valid citation is labelled an inference, never "sourced".

export interface Evidence {
  id: string;                 // "E1", "E2", ... unique within one agent's answer
  label: string;              // short human title, e.g. "Report: Kisumu borehole"
  source: string;             // provider: 'devmapper', 'worldbank', 'iati', 'openalex', ...
  kind: "record" | "live";    // stored DevMapper record vs. fetched live from an external API
  entityType?: string;
  entityId?: string;
  path?: string;              // in-app link
  url?: string;               // external link to the original
  retrievedAt: string;        // ISO timestamp
  content: string;            // what the model sees (trimmed)
}

export interface Claim {
  text: string;
  sources: string[];          // evidence ids
  basis: "sourced" | "inference";
}

export interface AgentAnswer {
  agentName: string;
  summary: string;
  keyInsights: Claim[];
  risks: Claim[];
  recommendedActions: Claim[];
  missingData: string[];
  evidence: Evidence[];
  confidenceScore: number;    // % of factual claims (insights + risks) backed by evidence
  requiresHumanReview: boolean;
  disclaimer?: string;
}

const MAX_CONTENT = 900;

/** Collects evidence with sequential ids. */
export class EvidenceSet {
  private items: Evidence[] = [];
  constructor(private readonly prefix = "E") {}

  add(e: Omit<Evidence, "id" | "retrievedAt"> & { retrievedAt?: string }): string {
    const id = `${this.prefix}${this.items.length + 1}`;
    this.items.push({ ...e, id, retrievedAt: e.retrievedAt ?? new Date().toISOString(), content: e.content.slice(0, MAX_CONTENT) });
    return id;
  }

  /** One evidence item per row; `pick` chooses the fields worth showing the model. */
  rows<T extends Record<string, unknown>>(
    rows: T[] | null | undefined,
    opts: { label: (r: T) => string; entityType?: string; id?: (r: T) => string; path?: (r: T) => string; pick?: (keyof T)[]; source?: string; url?: (r: T) => string | undefined },
  ) {
    for (const r of rows ?? []) {
      const shown = opts.pick ? Object.fromEntries(opts.pick.map((k) => [k, r[k]]).filter(([, v]) => v !== null && v !== undefined && v !== "")) : r;
      this.add({
        label: opts.label(r),
        source: opts.source ?? "devmapper",
        kind: "record",
        entityType: opts.entityType,
        entityId: opts.id?.(r),
        path: opts.path?.(r),
        url: opts.url?.(r),
        content: JSON.stringify(shown),
      });
    }
  }

  get list(): Evidence[] {
    return this.items;
  }
}

/** The evidence block shown to the model. */
export function evidencePrompt(evidence: Evidence[]): string {
  if (evidence.length === 0) return "EVIDENCE: none was found in DevMapper's data or the live sources for this question.";
  return "EVIDENCE (cite by id):\n" + evidence.map((e) =>
    `[${e.id}] ${e.label} | source: ${e.source}${e.kind === "live" ? " (live)" : ""} | retrieved ${e.retrievedAt.slice(0, 10)}\n${e.content}`,
  ).join("\n\n");
}

export const ANSWER_FORMAT = `Respond with ONLY a JSON object, no prose before or after, in this shape:
{
  "summary": "2-4 sentence direct answer to the question",
  "keyInsights": [{"text": "one finding", "sources": ["E1"], "basis": "sourced"}],
  "risks": [{"text": "...", "sources": [], "basis": "inference"}],
  "recommendedActions": [{"text": "...", "sources": ["E2"], "basis": "sourced"}],
  "missingData": ["what data would be needed but is not in the evidence"]
}
Rules: "basis" is "sourced" only when the listed evidence ids directly support the text; otherwise use "inference" with an empty sources list. Never cite an id that is not in the EVIDENCE list. Up to 5 items per list.`;

const asText = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function toClaims(v: unknown, valid: Set<string>): Claim[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 6).flatMap((c): Claim[] => {
    if (typeof c === "string") return c.trim() ? [{ text: c.trim(), sources: [], basis: "inference" }] : [];
    if (!c || typeof c !== "object") return [];
    const o = c as Record<string, unknown>;
    const text = asText(o.text);
    if (!text) return [];
    const sources = Array.isArray(o.sources) ? [...new Set(o.sources.filter((s): s is string => typeof s === "string" && valid.has(s)))] : [];
    return [{ text, sources, basis: o.basis === "sourced" && sources.length > 0 ? "sourced" : "inference" }];
  });
}

/** Share (0-100) of factual claims that are backed by evidence. */
export function evidenceCoverage(a: Pick<AgentAnswer, "keyInsights" | "risks">): number {
  const factual = [...a.keyInsights, ...a.risks];
  if (factual.length === 0) return 0;
  return Math.round((100 * factual.filter((c) => c.basis === "sourced").length) / factual.length);
}

/** Parses the model's JSON answer; tolerates code fences and falls back to plain text. */
export function parseAnswer(raw: string, agentName: string, evidence: Evidence[]): AgentAnswer {
  const valid = new Set(evidence.map((e) => e.id));
  let obj: Record<string, unknown> | null = null;
  const body = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { obj = JSON.parse(body.slice(start, end + 1)); } catch { obj = null; }
  }
  const answer: AgentAnswer = obj
    ? {
        agentName,
        summary: asText(obj.summary) || "No summary provided.",
        keyInsights: toClaims(obj.keyInsights, valid),
        risks: toClaims(obj.risks, valid),
        recommendedActions: toClaims(obj.recommendedActions, valid),
        missingData: Array.isArray(obj.missingData) ? obj.missingData.filter((m): m is string => typeof m === "string" && !!m.trim()).slice(0, 6) : [],
        evidence,
        confidenceScore: 0,
        requiresHumanReview: false,
      }
    : { agentName, summary: raw.trim().slice(0, 1200), keyInsights: [], risks: [], recommendedActions: [], missingData: [], evidence, confidenceScore: 0, requiresHumanReview: true };
  answer.confidenceScore = evidenceCoverage(answer);
  answer.requiresHumanReview = answer.requiresHumanReview || answer.confidenceScore < 60;
  return answer;
}

export interface Synthesis {
  summary: string;
  keyInsights: Claim[];
  risks: Claim[];
  recommendedActions: Claim[];
  missingData: string[];
  evidence: Evidence[];       // renumbered "1", "2", ... across all agents
  agentContributions: { agentName: string; mainContribution: string; confidence: number }[];
  overallConfidence: number;
  requiresHumanApproval: boolean;
  disclaimer: string;
}

/**
 * Merges agent answers (primary first). Evidence is renumbered globally and claims are
 * rewritten to the new ids; identical evidence (same entity or URL) is merged.
 */
export function synthesize(answers: AgentAnswer[]): Synthesis {
  const evidence: Evidence[] = [];
  const keyOf = (e: Evidence) => e.entityType && e.entityId ? `${e.entityType}:${e.entityId}` : e.url ?? `${e.label}|${e.content}`;
  const byKey = new Map<string, string>();
  const remap = (answerIdx: number, id: string) => `${answerIdx}:${id}`;
  const idMap = new Map<string, string>();

  answers.forEach((a, i) => {
    for (const e of a.evidence) {
      const k = keyOf(e);
      let gid = byKey.get(k);
      if (!gid) {
        gid = String(evidence.length + 1);
        byKey.set(k, gid);
        evidence.push({ ...e, id: gid });
      }
      idMap.set(remap(i, e.id), gid);
    }
  });

  const merge = (pick: (a: AgentAnswer) => Claim[]) => {
    const seen = new Set<string>();
    const out: Claim[] = [];
    answers.forEach((a, i) => {
      for (const c of pick(a)) {
        const norm = c.text.toLowerCase().replace(/\s+/g, " ");
        if (seen.has(norm)) continue;
        seen.add(norm);
        out.push({ ...c, sources: c.sources.map((s) => idMap.get(remap(i, s))).filter((s): s is string => !!s) });
      }
    });
    return out.slice(0, 8);
  };

  const keyInsights = merge((a) => a.keyInsights);
  const risks = merge((a) => a.risks);
  const recommendedActions = merge((a) => a.recommendedActions);
  const overallConfidence = evidenceCoverage({ keyInsights, risks });
  return {
    summary: answers.map((a) => a.summary).filter(Boolean).join(" ").slice(0, 1200),
    keyInsights,
    risks,
    recommendedActions,
    missingData: [...new Set(answers.flatMap((a) => a.missingData))].slice(0, 8),
    evidence,
    agentContributions: answers.map((a) => ({ agentName: a.agentName, mainContribution: a.summary.slice(0, 300), confidence: a.confidenceScore })),
    overallConfidence,
    requiresHumanApproval: answers.some((a) => a.requiresHumanReview) || overallConfidence < 60,
    disclaimer: "AI-generated analysis. Sourced statements cite the records they rely on; inferences are not verified. Not legal or financial advice.",
  };
}
