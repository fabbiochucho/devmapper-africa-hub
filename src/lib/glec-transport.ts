/**
 * GLEC Framework / ISO 14083 transport & freight emissions calculation.
 *
 * The *calculation method* - well-to-wheel emissions = shipment weight x
 * distance x a mode/vehicle-class-specific emission factor
 * (kgCO2e/tonne-km) - is the correct, standard activity-based approach
 * used by both the GLEC Framework and ISO 14083.
 *
 * Factor values are real published defaults from the **GLEC Framework
 * v3.2** (Smart Freight Centre, 2025), well-to-wheel, AR6 GWP-100 basis,
 * EU/South America region set - a legitimate citable public source, not a
 * guess. Multiple vehicle/vessel classes are represented per mode (not
 * collapsed into one number) since GLEC's real factors vary meaningfully
 * by size class - eg. road ranges 0.074-0.22 depending on vehicle class,
 * sea ranges 0.0031-0.0312 depending on vessel size. This is still not
 * GLEC's full size/load/route-differentiated table (which also varies by
 * region - China/India/North America sets differ from the EU/SA figures
 * used here) - for a shipment where the exact region is known, prefer the
 * matching regional GLEC Framework v3.2 row.
 */

export type TransportMode = 'road' | 'rail' | 'sea' | 'air' | 'inland_waterway';

export type RoadVehicleClass = 'rigid_12_20t' | 'articulated_18_27t' | 'articulated_34_40t' | 'articulated_49t_plus';
export type RailTraction = 'diesel' | 'electric';
export type SeaVesselClass = 'bulk_small_0_10kdwt' | 'bulk_medium_60_100kdwt' | 'bulk_large_200kdwt_plus';
export type AirCargoClass = 'freighter_short_haul' | 'freighter_long_haul' | 'belly_cargo_long_haul';

export interface GlecTransportInput {
  mode: TransportMode;
  distanceKm: number;
  weightTonnes: number;
  /** Load factor (0-1): fraction of vehicle/vessel capacity used, on top of the class-specific factor's own embedded load assumption. Defaults to 1 (no further adjustment). */
  loadFactor?: number;
  /** Vehicle class for mode='road'. Defaults to 'articulated_34_40t' (a common general-freight class) if omitted. */
  roadVehicleClass?: RoadVehicleClass;
  /** Traction type for mode='rail'. Defaults to 'diesel' if omitted. */
  railTraction?: RailTraction;
  /** Vessel size class for mode='sea'. Defaults to 'bulk_medium_60_100kdwt' if omitted. */
  seaVesselClass?: SeaVesselClass;
  /** Cargo/haul class for mode='air'. Defaults to 'belly_cargo_long_haul' if omitted. */
  airCargoClass?: AirCargoClass;
}

export interface GlecTransportResult {
  emissionsKgCo2e: number;
  factorUsed: number;
  mode: TransportMode;
  classUsed: string;
  note: string;
}

/** kg CO2e per tonne-km, well-to-wheel, GLEC Framework v3.2, EU/South America region set. */
const ROAD_FACTORS: Record<RoadVehicleClass, number> = {
  rigid_12_20t: 0.22,
  articulated_18_27t: 0.107,
  articulated_34_40t: 0.101,
  articulated_49t_plus: 0.074,
};

const RAIL_FACTORS: Record<RailTraction, number> = {
  diesel: 0.0307,
  electric: 0.0108,
};

const SEA_FACTORS: Record<SeaVesselClass, number> = {
  bulk_small_0_10kdwt: 0.0312,
  bulk_medium_60_100kdwt: 0.0052,
  bulk_large_200kdwt_plus: 0.0031,
};

const AIR_FACTORS: Record<AirCargoClass, number> = {
  freighter_short_haul: 1.516,
  freighter_long_haul: 0.608,
  belly_cargo_long_haul: 0.936,
};

/** Inland waterway (container vessel, 135m) - only one confirmed class found in research. */
const INLAND_WATERWAY_FACTOR = 0.0226;

function resolveFactorAndClass(input: GlecTransportInput): { factor: number; classUsed: string } {
  switch (input.mode) {
    case 'road': {
      const cls = input.roadVehicleClass ?? 'articulated_34_40t';
      return { factor: ROAD_FACTORS[cls], classUsed: cls };
    }
    case 'rail': {
      const cls = input.railTraction ?? 'diesel';
      return { factor: RAIL_FACTORS[cls], classUsed: `rail_${cls}` };
    }
    case 'sea': {
      const cls = input.seaVesselClass ?? 'bulk_medium_60_100kdwt';
      return { factor: SEA_FACTORS[cls], classUsed: cls };
    }
    case 'air': {
      const cls = input.airCargoClass ?? 'belly_cargo_long_haul';
      return { factor: AIR_FACTORS[cls], classUsed: cls };
    }
    case 'inland_waterway':
      return { factor: INLAND_WATERWAY_FACTOR, classUsed: 'inland_waterway_container_135m' };
  }
}

export function estimateGlecTransportEmissions(input: GlecTransportInput): GlecTransportResult {
  const loadFactor = input.loadFactor ?? 1;
  const effectiveLoadFactor = Math.max(0.1, Math.min(1, loadFactor));
  const { factor: baseFactor, classUsed } = resolveFactorAndClass(input);
  // Under-loaded shipments emit more per tonne-km carried, since the
  // vehicle/vessel's own emissions are amortized over less cargo. This is
  // on top of the load assumption already embedded in each class factor.
  const adjustedFactor = baseFactor / effectiveLoadFactor;

  const tonneKm = input.weightTonnes * input.distanceKm;
  const emissionsKg = tonneKm * adjustedFactor;

  return {
    emissionsKgCo2e: Math.round(emissionsKg),
    factorUsed: adjustedFactor,
    mode: input.mode,
    classUsed,
    note: `GLEC Framework v3.2 (Smart Freight Centre, 2025), EU/South America region set, vehicle/vessel class: ${classUsed}.`,
  };
}
