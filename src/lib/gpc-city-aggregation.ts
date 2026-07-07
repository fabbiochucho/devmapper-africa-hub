/**
 * GPC (Global Protocol for Community-Scale Inventories) city/state/national
 * aggregation - Phase 3, scaffold only. No computation implemented yet.
 */

export interface GpcSectorEmissions {
  sector: 'stationary_energy' | 'transportation' | 'waste' | 'ippu' | 'afolu';
  emissionsTonnesCo2e: number;
}

export interface GpcInventoryStub {
  cityName: string;
  reportingYear: number;
  sectors: GpcSectorEmissions[];
  totalTonnesCo2e: number;
}

export function summarizeGpcInventory(sectors: GpcSectorEmissions[]): number {
  return sectors.reduce((sum, s) => sum + s.emissionsTonnesCo2e, 0);
}
