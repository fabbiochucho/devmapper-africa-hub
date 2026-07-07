/**
 * GLEC Framework (transport/freight emissions) - Phase 3, scaffold only.
 * No computation implemented yet; this just defines the shape a future
 * transport-emissions module would fill in.
 */

export interface GlecTransportInput {
  mode: 'road' | 'rail' | 'sea' | 'air' | 'inland_waterway';
  distanceKm: number;
  weightTonnes: number;
}

export interface GlecTransportResult {
  emissionsKgCo2e: number | null;
  note: string;
}

export function estimateGlecTransportEmissions(_input: GlecTransportInput): GlecTransportResult {
  return {
    emissionsKgCo2e: null,
    note: 'GLEC transport emission factors are not yet implemented - Phase 3 scaffold only.',
  };
}
