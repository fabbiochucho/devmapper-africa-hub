/**
 * Maps an organization's real esg_indicators data against a reporting
 * framework's seeded indicator list (public.framework_indicators, seeded in
 * migration 20260514131308 for GRI, CDP, CSRD, SBTi, TCFD, IFRS-S1/S2,
 * NG-FRC-SRG1). Shared by both the GRI native indicator mapping (#19) and
 * the CSRD compliance module (#21), since both are the identical
 * operation applied to a different framework code: does the org have real
 * data behind each of this framework's indicator codes?
 *
 * Each indicator's `metric_key` is checked against esg_indicators in one of
 * three ways:
 *   - direct: metric_key is an actual esg_indicators column.
 *   - derived: metric_key names a value computed from other columns
 *     (e.g. carbon_total_tonnes = scope1 + scope2 + scope3).
 *   - converted: metric_key wants a different unit than the column stores
 *     (e.g. water_withdrawal_ml wants megaliters, the column is m3).
 * metric_keys matching none of these (e.g. employee_turnover,
 * workforce_total - this system has no workforce/HR data at all) are
 * marked dataAvailable: false rather than silently treated as "0 reported"
 * or skipped - the assessment should say "not trackable here", not imply
 * the org failed to disclose something the system never collects.
 */

export interface EsgIndicatorsRow {
  carbon_scope1_tonnes: number | null;
  carbon_scope2_tonnes: number | null;
  carbon_scope3_tonnes: number | null;
  energy_consumption_kwh: number | null;
  water_consumption_m3: number | null;
  waste_generated_tonnes: number | null;
  renewable_energy_percentage: number | null;
  community_investment: number | null;
}

export interface FrameworkIndicatorSeed {
  indicator_code: string;
  indicator_name: string;
  description: string | null;
  unit_of_measure: string | null;
  metric_key: string | null;
}

export interface MappedIndicator {
  indicatorCode: string;
  indicatorName: string;
  description: string | null;
  unitOfMeasure: string | null;
  metricKey: string | null;
  /** False when metric_key doesn't correspond to any column, derived, or converted value this system tracks. */
  dataAvailable: boolean;
  /** Only meaningful when dataAvailable is true. */
  reportedValue: number | null;
  satisfied: boolean;
}

export interface FrameworkMappingResult {
  frameworkCode: string;
  reportingYear: number;
  indicators: MappedIndicator[];
  satisfiedCount: number;
  /** Indicators this system has no data source for at all - excluded from the completeness % denominator. */
  notTrackableCount: number;
  /** Denominator: indicators where data IS at least trackable (dataAvailable), whether reported or not. */
  trackableCount: number;
  completenessPercentage: number;
}

function resolveMetricValue(metricKey: string | null, row: EsgIndicatorsRow | null): { dataAvailable: boolean; value: number | null } {
  if (!metricKey || !row) return { dataAvailable: !!metricKey && DIRECT_OR_DERIVED_KEYS.has(metricKey), value: null };

  switch (metricKey) {
    case 'carbon_scope1_tonnes':
    case 'carbon_scope2_tonnes':
    case 'carbon_scope3_tonnes':
    case 'renewable_energy_percentage':
    case 'waste_generated_tonnes':
      return { dataAvailable: true, value: (row as any)[metricKey] ?? null };

    // Derived: sum of the three scopes.
    case 'carbon_total_tonnes': {
      const s1 = row.carbon_scope1_tonnes ?? 0;
      const s2 = row.carbon_scope2_tonnes ?? 0;
      const s3 = row.carbon_scope3_tonnes ?? 0;
      const hasAny = row.carbon_scope1_tonnes != null || row.carbon_scope2_tonnes != null || row.carbon_scope3_tonnes != null;
      return { dataAvailable: true, value: hasAny ? s1 + s2 + s3 : null };
    }

    // Converted: energy_consumption_kwh -> GJ (1 kWh = 0.0036 GJ).
    case 'energy_consumption_gj':
      return { dataAvailable: true, value: row.energy_consumption_kwh != null ? row.energy_consumption_kwh * 0.0036 : null };

    // Converted: water_consumption_m3 -> megaliters (1 ML = 1000 m3).
    case 'water_withdrawal_ml':
    case 'water_consumption_ml':
      return { dataAvailable: true, value: row.water_consumption_m3 != null ? row.water_consumption_m3 / 1000 : null };

    default:
      // e.g. employee_turnover, workforce_total, tcfd_governance,
      // ifrs_strategy, sbti_near_term_target - narrative or workforce
      // fields this schema has no column for at all.
      return { dataAvailable: false, value: null };
  }
}

const DIRECT_OR_DERIVED_KEYS = new Set([
  'carbon_scope1_tonnes', 'carbon_scope2_tonnes', 'carbon_scope3_tonnes',
  'renewable_energy_percentage', 'waste_generated_tonnes', 'carbon_total_tonnes',
  'energy_consumption_gj', 'water_withdrawal_ml', 'water_consumption_ml',
]);

export function mapEsgIndicatorsToFramework(
  frameworkCode: string,
  frameworkIndicators: FrameworkIndicatorSeed[],
  esgIndicatorsRow: EsgIndicatorsRow | null,
  reportingYear: number,
): FrameworkMappingResult {
  const indicators: MappedIndicator[] = frameworkIndicators.map((fi) => {
    const { dataAvailable, value } = resolveMetricValue(fi.metric_key, esgIndicatorsRow);
    const satisfied = dataAvailable && value != null && value !== 0;
    return {
      indicatorCode: fi.indicator_code,
      indicatorName: fi.indicator_name,
      description: fi.description,
      unitOfMeasure: fi.unit_of_measure,
      metricKey: fi.metric_key,
      dataAvailable,
      reportedValue: value,
      satisfied,
    };
  });

  const notTrackableCount = indicators.filter((i) => !i.dataAvailable).length;
  const trackableCount = indicators.length - notTrackableCount;
  const satisfiedCount = indicators.filter((i) => i.satisfied).length;

  return {
    frameworkCode,
    reportingYear,
    indicators,
    satisfiedCount,
    notTrackableCount,
    trackableCount,
    completenessPercentage: trackableCount > 0 ? Math.round((satisfiedCount / trackableCount) * 100) : 0,
  };
}
