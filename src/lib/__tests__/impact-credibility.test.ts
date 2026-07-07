import { describe, it, expect } from "vitest";
import {
  calculateCredibilityScore,
  getCredibilityColor,
  getCredibilityBgColor,
  getCredibilityLabel,
} from "../impact-credibility";

const baseInput = {
  verificationTier: "none" as const,
  evidenceCount: 0,
  carbonDataVerified: false,
  reportCompleteness: 0,
  lastUpdated: new Date().toISOString(),
};

describe("calculateCredibilityScore", () => {
  it("returns 0 for a fully empty/unverified project", () => {
    expect(calculateCredibilityScore(baseInput)).toBe(0);
  });

  it("scores institutional verification at 40 points", () => {
    const score = calculateCredibilityScore({ ...baseInput, verificationTier: "institutional" });
    expect(score).toBe(40);
  });

  it("caps evidence count contribution at 20 points", () => {
    const score = calculateCredibilityScore({ ...baseInput, evidenceCount: 100 });
    expect(score).toBe(20);
  });

  it("adds 15 points for verified carbon data", () => {
    const score = calculateCredibilityScore({ ...baseInput, carbonDataVerified: true });
    expect(score).toBe(15);
  });

  it("caps report completeness contribution at 10 points", () => {
    const score = calculateCredibilityScore({ ...baseInput, reportCompleteness: 5 });
    expect(score).toBe(10);
  });

  it("applies a staleness penalty for updates older than 6 months", () => {
    const staleDate = new Date();
    staleDate.setMonth(staleDate.getMonth() - 7);
    const fresh = calculateCredibilityScore({ ...baseInput, carbonDataVerified: true, lastUpdated: new Date().toISOString() });
    const stale = calculateCredibilityScore({ ...baseInput, carbonDataVerified: true, lastUpdated: staleDate.toISOString() });
    expect(stale).toBe(fresh - 10);
  });

  it("never goes below 0 even with a staleness penalty on an empty score", () => {
    const staleDate = new Date();
    staleDate.setFullYear(staleDate.getFullYear() - 2);
    expect(calculateCredibilityScore({ ...baseInput, lastUpdated: staleDate.toISOString() })).toBe(0);
  });

  it("reaches the maximum achievable score (40+20+15+10) for a maxed-out project", () => {
    const score = calculateCredibilityScore({
      verificationTier: "institutional",
      evidenceCount: 50,
      carbonDataVerified: true,
      reportCompleteness: 1,
      lastUpdated: new Date().toISOString(),
    });
    expect(score).toBe(85);
  });

  it("treats a null lastUpdated as no staleness penalty", () => {
    const score = calculateCredibilityScore({ ...baseInput, carbonDataVerified: true, lastUpdated: null });
    expect(score).toBe(15);
  });
});

describe("credibility display helpers", () => {
  it("labels low scores as Low Credibility with destructive styling", () => {
    expect(getCredibilityLabel(10)).toBe("Low Credibility");
    expect(getCredibilityColor(10)).toBe("text-destructive");
    expect(getCredibilityBgColor(10)).toContain("destructive");
  });

  it("labels mid scores as Moderate Credibility", () => {
    expect(getCredibilityLabel(55)).toBe("Moderate Credibility");
    expect(getCredibilityColor(55)).toBe("text-yellow-600");
  });

  it("labels high scores as High Credibility", () => {
    expect(getCredibilityLabel(90)).toBe("High Credibility");
    expect(getCredibilityColor(90)).toBe("text-green-600");
  });

  it("treats the 40/70 boundaries as inclusive of the lower tier", () => {
    expect(getCredibilityLabel(40)).toBe("Low Credibility");
    expect(getCredibilityLabel(70)).toBe("Moderate Credibility");
  });
});
