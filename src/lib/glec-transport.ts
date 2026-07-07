/**
 * GLEC Framework / ISO 14083 transport & freight emissions calculation.
 *
 * The *calculation method* - well-to-wheel emissions = shipment weight x
 * distance x a mode-specific emission factor (kgCO2e/tonne-km) - is the
 * correct, standard activity-based approach used by both the GLEC
 * Framework and ISO 14083.
 *
 * Factor values are real published defaults from the **GLEC Framework
 * v3.2** (Smart Freight Centre, 2023), well-to-wheel, AR6 GWP-100 basis -
 * this is a legitimate citable public source, not a guess. Each mode
 * covers a wide real-world range depending on vehicle/vessel size, load
 * factor, and route (eg. sea ranges ~0.003-0.031 kgCO2e/tonne-km across
 * vessel sizes; air ranges ~0.6-1.5 across haul length and cargo type) -
 * the constants below are a single representative point within each
 * mode's published range, not GLEC's full size/route-differentiated
 * table. For a shipment where the exact vehicle/vessel class is known,
 * look up the specific GLEC Framework v3.2 row rather than relying on
 * this single representative default.
 */

export type TransportMode = 'road' | 'rail' | 'sea' | 'air' | 'inland_waterway';

export interface GlecTransportInput {
  mode: TransportMode;
  distanceKm: number;
  weightTonnes: number;
  /** Load factor (0-1): fraction of vehicle/vessel capacity used. Lower load factors increase effective per-tonne-km emissions. Defaults to 1 (fully loaded) if omitted. */
  loadFactor?: number;
}

export interface GlecTransportResult {
  emissionsKgCo2e: number;
  factorUsed: number;
  mode: TransportMode;
  note: string;
}

/**
 * kg CO2e per tonne-km, well-to-wheel, GLEC Framework v3.2 defaults
 * (representative point within each mode's published range):
 * - road: articulated HGV 18-49t diesel, ~93% load (source range 0.074-0.107)
 * - rail: midpoint of EU diesel (0.0307) / electric (0.0108) traction
 * - sea: representative mid-size bulk/container vessel (source range 0.0031-0.0312 by vessel size)
 * - air: belly cargo, long-haul (source range 0.608-1.516 by haul length/cargo type)
 * - inland_waterway: container vessel, 135m
 */
const TRANSPORT_EMISSION_FACTORS: Record<TransportMode, number> = {
  road: 0.09,
  rail: 0.02,
  sea: 0.015,
  air: 0.9,
  inland_waterway: 0.0226,
};

export function estimateGlecTransportEmissions(input: GlecTransportInput): GlecTransportResult {
  const loadFactor = input.loadFactor ?? 1;
  const effectiveLoadFactor = Math.max(0.1, Math.min(1, loadFactor));
  const baseFactor = TRANSPORT_EMISSION_FACTORS[input.mode];
  // Under-loaded shipments emit more per tonne-km carried, since the
  // vehicle/vessel's own emissions are amortized over less cargo.
  const adjustedFactor = baseFactor / effectiveLoadFactor;

  const tonneKm = input.weightTonnes * input.distanceKm;
  const emissionsKg = tonneKm * adjustedFactor;

  return {
    emissionsKgCo2e: Math.round(emissionsKg),
    factorUsed: adjustedFactor,
    mode: input.mode,
    note: 'GLEC Framework v3.2 (Smart Freight Centre, 2023) representative default for this mode - not the size/route-specific value if the exact vehicle/vessel class is known.',
  };
}
