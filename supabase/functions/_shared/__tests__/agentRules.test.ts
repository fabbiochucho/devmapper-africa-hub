import { describe, it, expect } from "vitest";
import { applyAgentRules, LOW_EVIDENCE_NOTE } from "../agentRules";
import type { AgentAnswer } from "../evidence";

const sourced = { text: "Water access improved", sources: ["E1"], basis: "sourced" as const };
const inferred = { text: "Likely more funding", sources: [], basis: "inference" as const };
const base: AgentAnswer = {
  agentName: "t", summary: "Water access improved.", keyInsights: [sourced], risks: [], recommendedActions: [],
  missingData: [], evidence: [], confidenceScore: 100, requiresHumanReview: false,
};

describe("applyAgentRules", () => {
  it("passes well-sourced output through unchanged", () => {
    const r = applyAgentRules(base);
    expect(r.passed).toBe(true);
    expect(r.output).toEqual(base);
  });

  it("labels low-evidence answers and requires review instead of discarding them", () => {
    const r = applyAgentRules({ ...base, keyInsights: [inferred, inferred], confidenceScore: 0 });
    expect(r.violations).toEqual(["LOW_EVIDENCE"]);
    expect(r.output.summary.startsWith(LOW_EVIDENCE_NOTE)).toBe(true);
    expect(r.output.keyInsights).toHaveLength(2);
    expect(r.output.requiresHumanReview).toBe(true);
  });

  it("does not flag an honest 'no data' answer that makes no claims", () => {
    expect(applyAgentRules({ ...base, keyInsights: [], confidenceScore: 0, missingData: ["budget"] }).passed).toBe(true);
  });

  it("redacts emails and phone numbers and adds a disclaimer to recommendations", () => {
    const r = applyAgentRules({
      ...base,
      keyInsights: [{ ...sourced, text: "Contact jo@ngo.org or +254 712 345 678" }],
      recommendedActions: [inferred],
    });
    expect(r.violations).toContain("PII_LEAK");
    expect(r.output.keyInsights[0].text).toBe("Contact [REDACTED_EMAIL] or [REDACTED_PHONE]");
    expect(r.output.disclaimer).toMatch(/Not legal or financial advice/);
  });
});
