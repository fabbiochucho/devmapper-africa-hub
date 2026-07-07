import { describe, it, expect } from "vitest";
import { computeSbtiPathway, computeSdaPathway } from "../sbti-pathways";

describe("computeSbtiPathway (Absolute Contraction Approach)", () => {
  it("applies the published 4.2%/yr rate for 1.5C near-term targets", () => {
    const result = computeSbtiPathway({
      baselineYear: 2025,
      targetYear: 2030,
      baselineEmissions: 1000,
      targetType: "near_term",
      temperatureScenario: "1.5C",
    });
    expect(result.annualReductionRate).toBeCloseTo(0.042);
    expect(result.points[0]).toEqual({ year: 2025, emissions: 1000, fractionOfBaseline: 1 });
    expect(result.points[5].emissions).toBe(Math.round(1000 * (1 - 0.042 * 5)));
  });

  it("applies the published 2.5%/yr rate for well-below-2C", () => {
    const result = computeSbtiPathway({
      baselineYear: 2025,
      targetYear: 2030,
      baselineEmissions: 1000,
      targetType: "near_term",
      temperatureScenario: "well_below_2C",
    });
    expect(result.annualReductionRate).toBeCloseTo(0.025);
  });

  it("flags whether the horizon is within SBTi's recommended 5-10 years", () => {
    const withinRange = computeSbtiPathway({ baselineYear: 2025, targetYear: 2032, baselineEmissions: 100, targetType: "near_term" });
    const tooShort = computeSbtiPathway({ baselineYear: 2025, targetYear: 2027, baselineEmissions: 100, targetType: "near_term" });
    expect(withinRange.withinRecommendedHorizon).toBe(true);
    expect(tooShort.withinRecommendedHorizon).toBe(false);
  });

  it("never lets emissions go negative even past full decarbonization", () => {
    const result = computeSbtiPathway({ baselineYear: 2025, targetYear: 2050, baselineEmissions: 100, targetType: "near_term" });
    expect(result.points.every((p) => p.emissions >= 0)).toBe(true);
  });

  it("computes a net-zero rate that reaches ~10% residual by the target year", () => {
    const result = computeSbtiPathway({ baselineYear: 2025, targetYear: 2050, baselineEmissions: 1000, targetType: "net_zero" });
    const lastPoint = result.points[result.points.length - 1];
    expect(lastPoint.fractionOfBaseline).toBeCloseTo(0.1, 5);
  });
});

describe("computeSdaPathway (Sectoral Decarbonization Approach)", () => {
  it("starts exactly at the company's own baseline intensity in the baseline year", () => {
    const result = computeSdaPathway({
      baselineYear: 2025,
      companyBaselineIntensity: 2.0,
      sectorBenchmarkIntensity: 0.5,
      projectedActivityByYear: { 2025: 100 },
      convergenceYear: 2050,
    });
    expect(result.points[0].targetIntensity).toBe(2.0);
  });

  it("reaches exactly the sector benchmark intensity at the convergence year", () => {
    const result = computeSdaPathway({
      baselineYear: 2025,
      companyBaselineIntensity: 2.0,
      sectorBenchmarkIntensity: 0.5,
      projectedActivityByYear: { 2050: 100 },
      convergenceYear: 2050,
    });
    expect(result.points[0].targetIntensity).toBeCloseTo(0.5);
  });

  it("interpolates linearly at the midpoint between baseline and convergence years", () => {
    const result = computeSdaPathway({
      baselineYear: 2020,
      companyBaselineIntensity: 4.0,
      sectorBenchmarkIntensity: 0.0,
      projectedActivityByYear: { 2035: 100 },
      convergenceYear: 2050,
    });
    // 2035 is exactly halfway between 2020 and 2050
    expect(result.points[0].targetIntensity).toBeCloseTo(2.0);
  });

  it("computes absolute emissions as target intensity times projected activity", () => {
    const result = computeSdaPathway({
      baselineYear: 2025,
      companyBaselineIntensity: 1.0,
      sectorBenchmarkIntensity: 1.0,
      projectedActivityByYear: { 2025: 500 },
      convergenceYear: 2050,
    });
    expect(result.points[0].targetAbsoluteEmissions).toBe(500);
  });

  it("defaults the convergence year to 2050 per SBTi's SDA standard", () => {
    const result = computeSdaPathway({
      baselineYear: 2025,
      companyBaselineIntensity: 2.0,
      sectorBenchmarkIntensity: 0.5,
      projectedActivityByYear: { 2025: 100 },
    });
    expect(result.convergenceYear).toBe(2050);
  });
});
