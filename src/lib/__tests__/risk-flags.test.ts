import { describe, it, expect } from "vitest";
import { deriveRiskFlags } from "../risk-flags";

const baseInput = {
  hasFinancialData: true,
  reportCost: 1000,
  verificationStatus: "approved" as const,
  evidenceCount: 3,
  deadline: null,
  milestonesTotal: 0,
  milestonesCompleted: 0,
};

describe("deriveRiskFlags", () => {
  it("returns no flags for a healthy, verified, on-time project", () => {
    expect(deriveRiskFlags(baseInput)).toEqual([]);
  });

  it("flags missing_financials when there is no financial data", () => {
    const flags = deriveRiskFlags({ ...baseInput, hasFinancialData: false, reportCost: null });
    expect(flags).toContainEqual(expect.objectContaining({ type: "missing_financials", severity: "high" }));
  });

  it("flags unverified_claims at high severity when rejected", () => {
    const flags = deriveRiskFlags({ ...baseInput, verificationStatus: "rejected" });
    expect(flags).toContainEqual(expect.objectContaining({ type: "unverified_claims", severity: "high" }));
  });

  it("flags unverified_claims at medium severity when never verified", () => {
    const flags = deriveRiskFlags({ ...baseInput, verificationStatus: "none" });
    expect(flags).toContainEqual(expect.objectContaining({ type: "unverified_claims", severity: "medium" }));
  });

  it("flags unverified_claims when verified but no evidence uploaded", () => {
    const flags = deriveRiskFlags({ ...baseInput, evidenceCount: 0 });
    expect(flags).toContainEqual(expect.objectContaining({ type: "unverified_claims" }));
  });

  it("flags a high-severity timeline_gap when the deadline has passed with incomplete milestones", () => {
    const pastDeadline = new Date();
    pastDeadline.setDate(pastDeadline.getDate() - 10);
    const flags = deriveRiskFlags({
      ...baseInput,
      deadline: pastDeadline.toISOString(),
      milestonesTotal: 4,
      milestonesCompleted: 2,
    });
    expect(flags).toContainEqual(expect.objectContaining({ type: "timeline_gap", severity: "high" }));
  });

  it("does not flag timeline_gap when the deadline passed but everything is complete", () => {
    const pastDeadline = new Date();
    pastDeadline.setDate(pastDeadline.getDate() - 10);
    const flags = deriveRiskFlags({
      ...baseInput,
      deadline: pastDeadline.toISOString(),
      milestonesTotal: 4,
      milestonesCompleted: 4,
    });
    expect(flags.some((f) => f.type === "timeline_gap")).toBe(false);
  });

  it("flags a low-severity timeline_gap when significantly behind schedule but not past due", () => {
    const futureDeadline = new Date();
    futureDeadline.setMonth(futureDeadline.getMonth() + 3);
    const flags = deriveRiskFlags({
      ...baseInput,
      deadline: futureDeadline.toISOString(),
      milestonesTotal: 10,
      milestonesCompleted: 1,
    });
    expect(flags).toContainEqual(expect.objectContaining({ type: "timeline_gap", severity: "low" }));
  });
});
