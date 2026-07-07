import { describe, it, expect } from "vitest";
import { computeSuggestedPriceRange } from "../marketplace-pricing";
import type { AlphaEarthBenchmark } from "../alphaearth-client";

const currentYear = new Date().getFullYear();

function makeBenchmark(overrides: Partial<AlphaEarthBenchmark> = {}): AlphaEarthBenchmark {
  return {
    country: "NG",
    sector: "renewable_energy",
    avg_carbon_intensity: 1,
    source: "AlphaEarth Foundations (Calculated)",
    confidence_score: 0.75,
    ...overrides,
  };
}

describe("computeSuggestedPriceRange", () => {
  it("computes a mid price from the project-type base and benchmark intensity", () => {
    const range = computeSuggestedPriceRange(
      { projectType: "renewable_energy", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ avg_carbon_intensity: 1 }),
    );
    // base(5.8) * intensityMultiplier(0.85 + 1*0.15 = 1.0) * vintageMultiplier(1) = 5.8
    expect(range.mid).toBe(5.8);
  });

  it("widens the range when benchmark confidence is low", () => {
    const highConfidence = computeSuggestedPriceRange(
      { projectType: "renewable_energy", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ confidence_score: 0.9 }),
    );
    const lowConfidence = computeSuggestedPriceRange(
      { projectType: "renewable_energy", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ confidence_score: 0.1 }),
    );
    const highSpread = highConfidence.high - highConfidence.low;
    const lowSpread = lowConfidence.high - lowConfidence.low;
    expect(lowSpread).toBeGreaterThan(highSpread);
  });

  it("discounts older vintages", () => {
    const fresh = computeSuggestedPriceRange(
      { projectType: "reforestation", countryCode: "KE", vintageYear: currentYear },
      makeBenchmark(),
    );
    const old = computeSuggestedPriceRange(
      { projectType: "reforestation", countryCode: "KE", vintageYear: currentYear - 10 },
      makeBenchmark(),
    );
    expect(old.mid).toBeLessThan(fresh.mid);
  });

  it("falls back to the 'other' base price for an unknown project type", () => {
    const known = computeSuggestedPriceRange(
      { projectType: "other", countryCode: "GH", vintageYear: currentYear },
      makeBenchmark({ avg_carbon_intensity: 1 }),
    );
    const unknown = computeSuggestedPriceRange(
      { projectType: "not_a_real_type", countryCode: "GH", vintageYear: currentYear },
      makeBenchmark({ avg_carbon_intensity: 1 }),
    );
    expect(unknown.mid).toBe(known.mid);
  });

  it("never suggests a low price below 1", () => {
    const range = computeSuggestedPriceRange(
      { projectType: "renewable_energy", countryCode: "NG", vintageYear: currentYear - 30 },
      makeBenchmark({ avg_carbon_intensity: 0, confidence_score: 0.05 }),
    );
    expect(range.low).toBeGreaterThanOrEqual(1);
  });

  it("includes the benchmark source alongside the price-anchor source", () => {
    const range = computeSuggestedPriceRange(
      { projectType: "mangrove", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ source: "AlphaEarth (Commercial)", confidence_score: 0.6 }),
    );
    expect(range.source).toContain("AlphaEarth (Commercial)");
    expect(range.source).toContain("VCM market average");
  });

  it("blends benchmark confidence and price-anchor confidence rather than passing either through directly", () => {
    // mangrove has a directly-cited price anchor (confidence 0.75); benchmark confidence here is 0.6.
    // blended = 0.6*0.4 + 0.75*0.6 = 0.69
    const range = computeSuggestedPriceRange(
      { projectType: "mangrove", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ confidence_score: 0.6 }),
    );
    expect(range.confidence).toBe(0.69);
  });

  it("gives category-specific price anchors (cookstoves) higher confidence than the market-average fallback (waste_management)", () => {
    const cookstoves = computeSuggestedPriceRange(
      { projectType: "cookstoves", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ confidence_score: 0.5 }),
    );
    const waste = computeSuggestedPriceRange(
      { projectType: "waste_management", countryCode: "NG", vintageYear: currentYear },
      makeBenchmark({ confidence_score: 0.5 }),
    );
    expect(cookstoves.confidence).toBeGreaterThan(waste.confidence);
  });
});
