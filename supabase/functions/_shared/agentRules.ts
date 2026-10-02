// Governance rules applied to every agent's output before it is stored or returned
// (formerly the uncalled ndovu-rule-engine function).

export interface RuleCheck<T> {
  passed: boolean;
  violations: string[];
  output: T;
}

interface CheckableOutput {
  summary: string;
  keyInsights: string[];
  risks: string[];
  recommendedActions: string[];
  confidenceScore: number;
  disclaimer?: string;
}

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE = /\+?\d[\d\s-]{8,14}\d/g;
const redact = (s: string) => s.replace(EMAIL, "[REDACTED_EMAIL]").replace(PHONE, "[REDACTED_PHONE]");

export function applyAgentRules<T extends CheckableOutput>(output: T): RuleCheck<T> {
  const violations: string[] = [];

  if (output.confidenceScore < 40) {
    return {
      passed: false,
      violations: ["CONFIDENCE_TOO_LOW"],
      output: {
        ...output,
        summary: "Not enough evidence in DevMapper's data to answer this reliably. Add project data or narrow the question and try again.",
        keyInsights: [],
        risks: [],
        recommendedActions: [],
      },
    };
  }

  const text = [output.summary, ...output.keyInsights, ...output.risks, ...output.recommendedActions].join("\n");
  EMAIL.lastIndex = 0; PHONE.lastIndex = 0;
  const hasPii = EMAIL.test(text) || PHONE.test(text);
  let out: T = output;
  if (hasPii) {
    violations.push("PII_LEAK");
    out = {
      ...out,
      summary: redact(out.summary),
      keyInsights: out.keyInsights.map(redact),
      risks: out.risks.map(redact),
      recommendedActions: out.recommendedActions.map(redact),
    };
  }

  if (out.recommendedActions.length > 0 || /\b(advice|recommend)/i.test(out.summary)) {
    out = { ...out, disclaimer: "AI-generated guidance. Not legal or financial advice." };
  }

  return { passed: violations.length === 0, violations, output: out };
}
