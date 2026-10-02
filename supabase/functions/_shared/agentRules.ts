// Governance rules applied to every agent's answer before it is stored or returned
// (formerly the uncalled ndovu-rule-engine function).
import type { AgentAnswer, Claim } from "./evidence.ts";

export interface RuleCheck {
  passed: boolean;
  violations: string[];
  output: AgentAnswer;
}

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE = /\+?\d[\d\s-]{8,14}\d/g;
const redact = (s: string) => s.replace(EMAIL, "[REDACTED_EMAIL]").replace(PHONE, "[REDACTED_PHONE]");
const redactClaims = (cs: Claim[]) => cs.map((c) => ({ ...c, text: redact(c.text) }));

export const LOW_EVIDENCE_NOTE =
  "Most statements below are AI inference, not backed by records in DevMapper's data or the live sources consulted.";

export function applyAgentRules(answer: AgentAnswer): RuleCheck {
  const violations: string[] = [];
  let out = answer;

  // Low evidence: keep the answer but say so up front and require human review.
  const factual = out.keyInsights.length + out.risks.length;
  if (factual > 0 && out.confidenceScore < 40) {
    violations.push("LOW_EVIDENCE");
    out = { ...out, summary: `${LOW_EVIDENCE_NOTE} ${out.summary}`, requiresHumanReview: true };
  }

  const text = [out.summary, ...[...out.keyInsights, ...out.risks, ...out.recommendedActions].map((c) => c.text)].join("\n");
  EMAIL.lastIndex = 0;
  PHONE.lastIndex = 0;
  if (EMAIL.test(text) || PHONE.test(text)) {
    violations.push("PII_LEAK");
    out = {
      ...out,
      summary: redact(out.summary),
      keyInsights: redactClaims(out.keyInsights),
      risks: redactClaims(out.risks),
      recommendedActions: redactClaims(out.recommendedActions),
    };
  }

  if (out.recommendedActions.length > 0 || /\b(advice|recommend)/i.test(out.summary)) {
    out = { ...out, disclaimer: "AI-generated guidance. Not legal or financial advice." };
  }

  return { passed: violations.length === 0, violations, output: out };
}
