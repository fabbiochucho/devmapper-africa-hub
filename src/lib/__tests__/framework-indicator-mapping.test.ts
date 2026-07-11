import { describe, it, expect } from "vitest";
import { mapEsgIndicatorsToFramework, type EsgIndicatorsRow, type FrameworkIndicatorSeed } from "../framework-indicator-mapping";

const csrdIndicators: FrameworkIndicatorSeed[] = [
  { indicator_code: "ESRS-E1-6", indicator_name: "Gross Scopes 1, 2, 3 and Total GHG emissions", description: null, unit_of_measure: "tCO2e", metric_key: "carbon_total_tonnes" },
  { indicator_code: "ESRS-E1-5", indicator_name: "Energy consumption and mix", description: null, unit_of_measure: "MWh", metric_key: "renewable_energy_percentage" },
  { indicator_code: "ESRS-E3-4", indicator_name: "Water consumption", description: null, unit_of_measure: "megaliters", metric_key: "water_consumption_ml" },
  { indicator_code: "ESRS-E5-5", indicator_name: "Resource outflows / waste", description: null, unit_of_measure: "tonnes", metric_key: "waste_generated_tonnes" },
  { indicator_code: "ESRS-S1-6", indicator_name: "Characteristics of the undertaking employees", description: null, unit_of_measure: "count", metric_key: "workforce_total" },
];

const fullRow: EsgIndicatorsRow = {
  carbon_scope1_tonnes: 100,
  carbon_scope2_tonnes: 50,
  carbon_scope3_tonnes: 200,
  energy_consumption_kwh: 10000,
  water_consumption_m3: 5000,
  waste_generated_tonnes: 12,
  renewable_energy_percentage: 30,
  community_investment: 0,
};

describe("mapEsgIndicatorsToFramework", () => {
  it("computes carbon_total_tonnes as the sum of all three scopes (derived field)", () => {
    const result = mapEsgIndicatorsToFramework("CSRD", csrdIndicators, fullRow, 2026);
    const e16 = result.indicators.find((i) => i.indicatorCode === "ESRS-E1-6")!;
    expect(e16.dataAvailable).toBe(true);
    expect(e16.reportedValue).toBe(350);
    expect(e16.satisfied).toBe(true);
  });

  it("converts water_consumption_m3 to megaliters (divide by 1000)", () => {
    const result = mapEsgIndicatorsToFramework("CSRD", csrdIndicators, fullRow, 2026);
    const e34 = result.indicators.find((i) => i.indicatorCode === "ESRS-E3-4")!;
    expect(e34.reportedValue).toBe(5);
  });

  it("marks workforce_total as not trackable rather than a false gap, and excludes it from the completeness denominator", () => {
    const result = mapEsgIndicatorsToFramework("CSRD", csrdIndicators, fullRow, 2026);
    const s16 = result.indicators.find((i) => i.indicatorCode === "ESRS-S1-6")!;
    expect(s16.dataAvailable).toBe(false);
    expect(s16.satisfied).toBe(false);
    expect(result.notTrackableCount).toBe(1);
    expect(result.trackableCount).toBe(4);
  });

  it("computes completeness percentage over only the trackable indicators", () => {
    const result = mapEsgIndicatorsToFramework("CSRD", csrdIndicators, fullRow, 2026);
    // 4 trackable, all 4 satisfied (non-zero) with fullRow -> 100%
    expect(result.completenessPercentage).toBe(100);
  });

  it("treats a zero-value indicator as not satisfied", () => {
    const zeroRow: EsgIndicatorsRow = { ...fullRow, waste_generated_tonnes: 0 };
    const result = mapEsgIndicatorsToFramework("CSRD", csrdIndicators, zeroRow, 2026);
    const e55 = result.indicators.find((i) => i.indicatorCode === "ESRS-E5-5")!;
    expect(e55.satisfied).toBe(false);
    expect(result.completenessPercentage).toBe(75); // 3 of 4 trackable satisfied
  });

  it("handles a null esg_indicators row (org has never reported) without throwing", () => {
    const result = mapEsgIndicatorsToFramework("CSRD", csrdIndicators, null, 2026);
    expect(result.satisfiedCount).toBe(0);
    expect(result.completenessPercentage).toBe(0);
    const e16 = result.indicators.find((i) => i.indicatorCode === "ESRS-E1-6")!;
    expect(e16.dataAvailable).toBe(true);
    expect(e16.reportedValue).toBeNull();
  });
});
