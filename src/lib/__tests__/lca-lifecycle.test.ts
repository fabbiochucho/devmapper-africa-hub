import { describe, it, expect } from "vitest";
import { characterizeInventory, characterizeOdpInventory, characterizeAcidificationInventory } from "../lca-lifecycle";

describe("characterizeInventory (GWP100)", () => {
  it("treats 1kg CO2 as exactly 1kg CO2e", () => {
    const result = characterizeInventory([{ substance: "co2", amountKg: 100, direction: "output", stage: "use" }]);
    expect(result.totalKgCo2e).toBe(100);
  });

  it("applies the IPCC AR6 GWP100 factor for methane (27.9)", () => {
    const result = characterizeInventory([{ substance: "ch4", amountKg: 10, direction: "output", stage: "use" }]);
    expect(result.totalKgCo2e).toBe(Math.round(10 * 27.9));
  });

  it("subtracts input (removal) flows from the total", () => {
    const result = characterizeInventory([
      { substance: "co2", amountKg: 100, direction: "output", stage: "use" },
      { substance: "co2", amountKg: 40, direction: "input", stage: "sequestration" },
    ]);
    expect(result.totalKgCo2e).toBe(60);
  });
});

describe("characterizeOdpInventory", () => {
  it("treats CFC-11 as the ODP reference substance (1.0)", () => {
    const result = characterizeOdpInventory([{ substance: "cfc_11", amountKg: 10, direction: "output", stage: "use" }]);
    expect(result.totalKgCfc11e).toBe(10);
  });

  it("applies the Montreal Protocol reference value for Halon-1301 (10x)", () => {
    const result = characterizeOdpInventory(
      [{ substance: "halon_1301", amountKg: 1, direction: "output", stage: "use" }],
      "montreal_protocol",
    );
    expect(result.totalKgCfc11e).toBe(10);
  });

  it("applies the WMO 2011 updated value for Halon-1301 (15.9x) when selected", () => {
    const result = characterizeOdpInventory(
      [{ substance: "halon_1301", amountKg: 1, direction: "output", stage: "use" }],
      "wmo_2011",
    );
    expect(result.totalKgCfc11e).toBe(15.9);
  });

  it("returns zero for an empty inventory", () => {
    const result = characterizeOdpInventory([]);
    expect(result.totalKgCfc11e).toBe(0);
  });

  it("defaults to the Montreal Protocol reference standard", () => {
    const result = characterizeOdpInventory([{ substance: "cfc_12", amountKg: 1, direction: "output", stage: "use" }]);
    expect(result.referenceStandard).toBe("montreal_protocol");
    expect(result.totalKgCfc11e).toBe(1); // Montreal Protocol ODP1 for CFC-12 is 1, not WMO2011's 0.82
  });
});

describe("characterizeAcidificationInventory (TRACI 2.1)", () => {
  it("treats SO2 as the acidification reference substance (1.0)", () => {
    const result = characterizeAcidificationInventory([{ substance: "so2", amountKg: 50, direction: "output", stage: "use" }]);
    expect(result.totalKgSo2e).toBe(50);
  });

  it("applies the TRACI 2.1 factor for NOx (0.7)", () => {
    const result = characterizeAcidificationInventory([{ substance: "nox", amountKg: 10, direction: "output", stage: "use" }]);
    expect(result.totalKgSo2e).toBe(7);
  });

  it("applies the TRACI 2.1 factor for NH3 (1.88)", () => {
    const result = characterizeAcidificationInventory([{ substance: "nh3", amountKg: 10, direction: "output", stage: "use" }]);
    expect(result.totalKgSo2e).toBe(18.8);
  });

  it("subtracts input flows from the total", () => {
    const result = characterizeAcidificationInventory([
      { substance: "so2", amountKg: 100, direction: "output", stage: "use" },
      { substance: "so2", amountKg: 30, direction: "input", stage: "scrubber_credit" },
    ]);
    expect(result.totalKgSo2e).toBe(70);
  });

  it("returns zero for an empty inventory", () => {
    const result = characterizeAcidificationInventory([]);
    expect(result.totalKgSo2e).toBe(0);
  });
});
