/**
 * GLEC Framework / ISO 14083 transport & freight emissions calculation.
 *
 * The *calculation method* implemented here - well-to-wheel emissions =
 * shipment weight x distance x a mode-specific emission factor
 * (gCO2e/tonne-km) - is the correct, standard activity-based approach
 * used by both the GLEC Framework and ISO 14083.
 *
 * TODO(business-logic, unverified): the factor VALUES in
 * TRANSPORT_EMISSION_FACTORS are representative/illustrative figures of the
 * right order of magnitude (drawn from commonly-cited public transport
 * emissions literature), NOT the GLEC-certified default values, which live
 * behind GLEC's own Emissions Factor Database / SFC (Smart Freight Centre)
 * tooling that this environment has no access to. Do not present a
 * calculation using these factors as GLEC-certified - it's a reasonable
 * estimate, not a compliant GLEC Framework disclosure, until the real
 * factor database is wired in.
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

/** gCO2e per tonne-km, representative order-of-magnitude figures - see module-level TODO. */
const TRANSPORT_EMISSION_FACTORS: Record<TransportMode, number> = {
  road: 90,
  rail: 25,
  sea: 15,
  air: 600,
  inland_waterway: 35,
};

export function estimateGlecTransportEmissions(input: GlecTransportInput): GlecTransportResult {
  const loadFactor = input.loadFactor ?? 1;
  const effectiveLoadFactor = Math.max(0.1, Math.min(1, loadFactor));
  const baseFactor = TRANSPORT_EMISSION_FACTORS[input.mode];
  // Under-loaded shipments emit more per tonne-km carried, since the
  // vehicle/vessel's own emissions are amortized over less cargo.
  const adjustedFactor = baseFactor / effectiveLoadFactor;

  const tonneKm = input.weightTonnes * input.distanceKm;
  const emissionsGrams = tonneKm * adjustedFactor;

  return {
    emissionsKgCo2e: Math.round(emissionsGrams / 1000),
    factorUsed: adjustedFactor,
    mode: input.mode,
    note: 'Representative emission factor, not GLEC-certified - see module-level TODO in glec-transport.ts.',
  };
}
