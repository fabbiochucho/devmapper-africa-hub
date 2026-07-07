import { describe, it, expect } from "vitest";
import {
  calculateFundingReadinessScore,
  getFundingReadinessLabel,
  getFundingReadinessColor,
} from "../funding-readiness";

const baseInput = {
  reportCost: null,
  roiPercentage: null,
  revenueGenerated: null,
  operationalCostSavings: null,
  carbonCreditValue: null,
  fundraisingTargetAmount: null,
  fundraisingRaisedAmount: null,
  hasVerifiedFinancials: false,
  timelineOnTrack: false,
};

describe("calculateFundingReadinessScore", () => {
  it("returns 0 for a project with no data at all", () => {
    expect(calculateFundingReadinessScore(baseInput)).toBe(0);
  });

  it("caps ROI contribution at 30 points", () => {
    expect(calculateFundingReadinessScore({ ...baseInput, roiPercentage: 500 })).toBe(30);
  });

  it("adds 25 points for verified financials", () => {
    expect(calculateFundingReadinessScore({ ...baseInput, hasVerifiedFinancials: true })).toBe(25);
  });

  it("scores fundraising progress proportionally, capped at 20 points", () => {
    const halfFunded = calculateFundingReadinessScore({
      ...baseInput,
      fundraisingTargetAmount: 1000,
      fundraisingRaisedAmount: 500,
    });
    const fullyFunded = calculateFundingReadinessScore({
      ...baseInput,
      fundraisingTargetAmount: 1000,
      fundraisingRaisedAmount: 1000,
    });
    const overFunded = calculateFundingReadinessScore({
      ...baseInput,
      fundraisingTargetAmount: 1000,
      fundraisingRaisedAmount: 5000,
    });
    expect(halfFunded).toBe(10);
    expect(fullyFunded).toBe(20);
    expect(overFunded).toBe(20);
  });

  it("adds 5 points per diversification signal, capped at 15", () => {
    const oneSignal = calculateFundingReadinessScore({ ...baseInput, revenueGenerated: 100 });
    const allSignals = calculateFundingReadinessScore({
      ...baseInput,
      revenueGenerated: 100,
      operationalCostSavings: 50,
      carbonCreditValue: 20,
    });
    expect(oneSignal).toBe(5);
    expect(allSignals).toBe(15);
  });

  it("adds 10 points when the timeline is on track", () => {
    expect(calculateFundingReadinessScore({ ...baseInput, timelineOnTrack: true })).toBe(10);
  });

  it("clamps at 100 for a maxed-out project", () => {
    const score = calculateFundingReadinessScore({
      reportCost: 1000,
      roiPercentage: 200,
      revenueGenerated: 500,
      operationalCostSavings: 300,
      carbonCreditValue: 200,
      fundraisingTargetAmount: 1000,
      fundraisingRaisedAmount: 1000,
      hasVerifiedFinancials: true,
      timelineOnTrack: true,
    });
    expect(score).toBe(100);
  });
});

describe("funding readiness display helpers", () => {
  it("labels low/mid/high scores correctly", () => {
    expect(getFundingReadinessLabel(10)).toBe("Low Readiness");
    expect(getFundingReadinessLabel(55)).toBe("Moderate Readiness");
    expect(getFundingReadinessLabel(90)).toBe("High Readiness");
  });

  it("returns matching text color classes", () => {
    expect(getFundingReadinessColor(10)).toBe("text-destructive");
    expect(getFundingReadinessColor(90)).toBe("text-green-600");
  });
});
