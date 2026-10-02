import { describe, it, expect } from "vitest";
import { toEmissionFactorRow, type GcFactor } from "../greencalculus";

const diesel: GcFactor = {
  key: "fuels.can.diesel.litre",
  name: "Canada Diesel — combustion (litres)",
  factor: { value: 2.68901, unit: "kg CO2e per litre", country_iso3: "can" },
  source: { id: "ECCC_EF_2025" },
  scope: { ghg_protocol: "scope1", category: "stationary_combustion" },
  updated: "2026-08-10",
  citation: { text: "Canada Diesel ...", proof_url: "https://verify.greencalculus.com/fuels.can.diesel.litre@2026.209" },
};

describe("toEmissionFactorRow", () => {
  it("maps a per-unit kg CO2e factor with its citation", () => {
    expect(toEmissionFactorRow(diesel)).toMatchObject({
      scope: 1, category: "stationary_combustion", activity: "fuels.can.diesel.litre", region: "CAN",
      unit: "litre", factor_kgco2e: 2.68901, source: "ECCC_EF_2025 via GreenCalculus", source_year: 2026,
    });
    expect(toEmissionFactorRow(diesel)!.notes).toContain("Verify: https://verify.greencalculus.com/");
  });

  it("rejects factors that would need unit conversion or have no scope", () => {
    expect(toEmissionFactorRow({ ...diesel, factor: { ...diesel.factor, unit: "g CO2e per litre" } })).toBeNull();
    expect(toEmissionFactorRow({ ...diesel, scope: {} })).toBeNull();
  });
});
