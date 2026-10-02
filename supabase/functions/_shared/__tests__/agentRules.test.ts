import { describe, it, expect } from "vitest";
import { applyAgentRules } from "../agentRules";

const base = { summary: "Water access improved.", keyInsights: ["a"], risks: [], recommendedActions: [], confidenceScore: 70 };

describe("applyAgentRules", () => {
  it("passes clean output through", () => {
    const r = applyAgentRules(base);
    expect(r.passed).toBe(true);
    expect(r.output).toEqual(base);
  });
  it("withholds low-confidence answers", () => {
    const r = applyAgentRules({ ...base, confidenceScore: 30 });
    expect(r.violations).toEqual(["CONFIDENCE_TOO_LOW"]);
    expect(r.output.keyInsights).toEqual([]);
  });
  it("redacts emails and phone numbers and adds a disclaimer to recommendations", () => {
    const r = applyAgentRules({ ...base, keyInsights: ["Contact jo@ngo.org or +254 712 345 678"], recommendedActions: ["Apply"] });
    expect(r.violations).toContain("PII_LEAK");
    expect(r.output.keyInsights[0]).toBe("Contact [REDACTED_EMAIL] or [REDACTED_PHONE]");
    expect(r.output.disclaimer).toMatch(/Not legal or financial advice/);
  });
});
