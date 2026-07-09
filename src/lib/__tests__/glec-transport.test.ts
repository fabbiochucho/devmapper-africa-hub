import { describe, it, expect } from "vitest";
import { estimateGlecTransportEmissions } from "../glec-transport";

describe("estimateGlecTransportEmissions", () => {
  it("computes road emissions as weight x distance x GLEC v3.2 factor for the given vehicle class", () => {
    const result = estimateGlecTransportEmissions({
      mode: "road",
      distanceKm: 100,
      weightTonnes: 10,
      roadVehicleClass: "articulated_49t_plus",
    });
    expect(result.emissionsKgCo2e).toBe(Math.round(100 * 10 * 0.074));
    expect(result.classUsed).toBe("articulated_49t_plus");
  });

  it("uses a heavier factor for smaller rigid trucks than large articulated trucks", () => {
    const rigid = estimateGlecTransportEmissions({ mode: "road", distanceKm: 100, weightTonnes: 10, roadVehicleClass: "rigid_12_20t" });
    const articulated = estimateGlecTransportEmissions({ mode: "road", distanceKm: 100, weightTonnes: 10, roadVehicleClass: "articulated_49t_plus" });
    expect(rigid.emissionsKgCo2e).toBeGreaterThan(articulated.emissionsKgCo2e);
  });

  it("defaults to articulated_34_40t when no road vehicle class is given", () => {
    const result = estimateGlecTransportEmissions({ mode: "road", distanceKm: 100, weightTonnes: 10 });
    expect(result.classUsed).toBe("articulated_34_40t");
  });

  it("uses a lower factor for electric rail traction than diesel", () => {
    const diesel = estimateGlecTransportEmissions({ mode: "rail", distanceKm: 100, weightTonnes: 10, railTraction: "diesel" });
    const electric = estimateGlecTransportEmissions({ mode: "rail", distanceKm: 100, weightTonnes: 10, railTraction: "electric" });
    expect(electric.emissionsKgCo2e).toBeLessThan(diesel.emissionsKgCo2e);
  });

  it("uses a lower factor for larger bulk sea vessels (economies of scale)", () => {
    const small = estimateGlecTransportEmissions({ mode: "sea", distanceKm: 1000, weightTonnes: 100, seaVesselClass: "bulk_small_0_10kdwt" });
    const large = estimateGlecTransportEmissions({ mode: "sea", distanceKm: 1000, weightTonnes: 100, seaVesselClass: "bulk_large_200kdwt_plus" });
    expect(large.emissionsKgCo2e).toBeLessThan(small.emissionsKgCo2e);
  });

  it("uses a much higher factor for air freight than any surface mode", () => {
    const air = estimateGlecTransportEmissions({ mode: "air", distanceKm: 1000, weightTonnes: 1, airCargoClass: "belly_cargo_long_haul" });
    const road = estimateGlecTransportEmissions({ mode: "road", distanceKm: 1000, weightTonnes: 1, roadVehicleClass: "articulated_34_40t" });
    expect(air.emissionsKgCo2e).toBeGreaterThan(road.emissionsKgCo2e * 5);
  });

  it("increases the effective factor for under-loaded shipments", () => {
    const fullyLoaded = estimateGlecTransportEmissions({ mode: "road", distanceKm: 100, weightTonnes: 10, loadFactor: 1 });
    const halfLoaded = estimateGlecTransportEmissions({ mode: "road", distanceKm: 100, weightTonnes: 10, loadFactor: 0.5 });
    expect(halfLoaded.factorUsed).toBeCloseTo(fullyLoaded.factorUsed * 2);
  });

  it("computes inland waterway emissions using its single confirmed factor", () => {
    const result = estimateGlecTransportEmissions({ mode: "inland_waterway", distanceKm: 100, weightTonnes: 10 });
    expect(result.emissionsKgCo2e).toBe(Math.round(100 * 10 * 0.0226));
  });
});
