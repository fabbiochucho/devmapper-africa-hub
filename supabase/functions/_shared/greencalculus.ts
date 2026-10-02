// The subset of a GreenCalculus factor we store.
export interface GcFactor {
  key: string;
  name: string;
  factor: { value: number; unit: string; country_iso3?: string | null };
  source: { id: string };
  scope?: { ghg_protocol?: string; category?: string };
  updated?: string;
  citation?: { text?: string; proof_url?: string };
}

/** Maps a GreenCalculus factor to an emission_factors row, or null when it can't be stored faithfully. */
export function toEmissionFactorRow(f: GcFactor) {
  // Only per-unit kg CO2e factors map onto factor_kgco2e without conversion.
  const unit = /^kg CO2e per (.+)$/i.exec(f.factor?.unit ?? "")?.[1]?.trim();
  const scope = Number(/^scope([123])$/.exec(f.scope?.ghg_protocol ?? "")?.[1]);
  if (!unit || !scope || !Number.isFinite(f.factor.value)) return null;
  const year = Number((f.updated ?? "").slice(0, 4));
  return {
    scope,
    category: f.scope?.category || "uncategorised",
    activity: f.key,
    region: (f.factor.country_iso3 || "GLOBAL").toUpperCase(),
    unit,
    factor_kgco2e: f.factor.value,
    source: `${f.source.id} via GreenCalculus`,
    source_year: year || null,
    notes: [f.name, f.citation?.text, f.citation?.proof_url && `Verify: ${f.citation.proof_url}`].filter(Boolean).join(" · "),
  };
}
