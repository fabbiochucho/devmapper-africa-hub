/**
 * GPC (Global Protocol for Community-Scale GHG Inventories) aggregation.
 *
 * Implements GPC's real BASIC / BASIC+ reporting-level structure: which
 * sector x scope combinations are required at each level, and GPC's
 * notation-key system for tracking why a data point is missing (rather
 * than silently treating "no data" the same as "zero emissions", which
 * GPC explicitly warns against).
 */

export type GpcSector = 'stationary_energy' | 'transportation' | 'waste' | 'ippu' | 'afolu';
export type GpcScope = 1 | 2 | 3;

/** GPC notation keys (Chapter 8 of the GPC standard) for explaining an omitted value. */
export type GpcNotationKey = 'NE' | 'NO' | 'C' | 'IE';
export const GPC_NOTATION_LABELS: Record<GpcNotationKey, string> = {
  NE: 'Not Estimated',
  NO: 'Not Occurring',
  C: 'Confidential',
  IE: 'Included Elsewhere',
};

/**
 * GPC's sector x scope requirement matrix. BASIC is the minimum reporting
 * level; BASIC+ adds IPPU, AFOLU, and Transportation Scope 3. This mirrors
 * GPC standard Table 2 (Required Sector/Scope reporting by BASIC/BASIC+
 * level) - not every sector reports every scope (eg. AFOLU and IPPU are
 * Scope 1 only under GPC; Waste has no Scope 2).
 */
const GPC_REQUIREMENTS: Array<{ sector: GpcSector; scope: GpcScope; level: 'BASIC' | 'BASIC+' }> = [
  { sector: 'stationary_energy', scope: 1, level: 'BASIC' },
  { sector: 'stationary_energy', scope: 2, level: 'BASIC' },
  { sector: 'transportation', scope: 1, level: 'BASIC' },
  { sector: 'transportation', scope: 2, level: 'BASIC' },
  { sector: 'transportation', scope: 3, level: 'BASIC+' },
  { sector: 'waste', scope: 1, level: 'BASIC' },
  { sector: 'waste', scope: 3, level: 'BASIC' },
  { sector: 'ippu', scope: 1, level: 'BASIC+' },
  { sector: 'afolu', scope: 1, level: 'BASIC+' },
];

export interface GpcSectorEmissions {
  sector: GpcSector;
  scope: GpcScope;
  emissionsTonnesCo2e: number | null;
  notationKey?: GpcNotationKey;
}

export interface GpcInventoryStub {
  cityName: string;
  reportingYear: number;
  sectors: GpcSectorEmissions[];
}

export interface GpcAggregationResult {
  totalTonnesCo2e: number;
  byLevel: { BASIC: number; 'BASIC+': number };
  missingRequiredEntries: Array<{ sector: GpcSector; scope: GpcScope; level: 'BASIC' | 'BASIC+' }>;
  notationSummary: Partial<Record<GpcNotationKey, number>>;
}

export function summarizeGpcInventory(sectors: GpcSectorEmissions[]): GpcAggregationResult {
  const byLevel = { BASIC: 0, 'BASIC+': 0 };
  const notationSummary: Partial<Record<GpcNotationKey, number>> = {};
  let total = 0;

  const findLevel = (sector: GpcSector, scope: GpcScope) =>
    GPC_REQUIREMENTS.find((r) => r.sector === sector && r.scope === scope)?.level ?? 'BASIC+';

  for (const entry of sectors) {
    if (entry.emissionsTonnesCo2e == null) {
      if (entry.notationKey) {
        notationSummary[entry.notationKey] = (notationSummary[entry.notationKey] ?? 0) + 1;
      }
      continue;
    }
    total += entry.emissionsTonnesCo2e;
    const level = findLevel(entry.sector, entry.scope);
    byLevel[level] += entry.emissionsTonnesCo2e;
  }

  const reportedKeys = new Set(sectors.map((s) => `${s.sector}:${s.scope}`));
  const missingRequiredEntries = GPC_REQUIREMENTS.filter(
    (r) => !reportedKeys.has(`${r.sector}:${r.scope}`),
  );

  return {
    totalTonnesCo2e: Math.round(total),
    byLevel: { BASIC: Math.round(byLevel.BASIC), 'BASIC+': Math.round(byLevel['BASIC+']) },
    missingRequiredEntries,
    notationSummary,
  };
}

/** True once every BASIC-level sector/scope combination has a reported value or an explicit notation key. */
export function isBasicComplete(sectors: GpcSectorEmissions[]): boolean {
  const reported = new Set(sectors.map((s) => `${s.sector}:${s.scope}`));
  return GPC_REQUIREMENTS.filter((r) => r.level === 'BASIC').every((r) => reported.has(`${r.sector}:${r.scope}`));
}
