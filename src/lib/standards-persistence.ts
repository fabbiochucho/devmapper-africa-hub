import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { SbtiPathwayResult, SbtiTargetType } from '@/lib/sbti-pathways';
import type { CdpAutoFillResponse } from '@/lib/cdp-questionnaire';
import type { GlecTransportResult, TransportMode } from '@/lib/glec-transport';
import type { LcaImpactAssessmentResult, OdpAssessmentResult, ApAssessmentResult } from '@/lib/lca-lifecycle';
import type { GpcAggregationResult } from '@/lib/gpc-city-aggregation';
import type { EsgIndicatorsRow, FrameworkIndicatorSeed, FrameworkMappingResult } from '@/lib/framework-indicator-mapping';

// ---- SBTi pathways ----

export interface SbtiPathwayRecord {
  id: string;
  sector: string;
  target_type: string | null;
  baseline_year: number | null;
  target_year: number | null;
  pathway_data: unknown;
  created_at: string;
}

export async function saveSbtiPathway(
  organizationId: string,
  sector: string,
  targetType: SbtiTargetType,
  baselineYear: number,
  targetYear: number,
  result: SbtiPathwayResult,
) {
  const { error } = await supabase.from('sbti_pathways').insert([{
    organization_id: organizationId,
    sector,
    target_type: targetType,
    baseline_year: baselineYear,
    target_year: targetYear,
    pathway_data: result as unknown as Json,
  }]);
  if (error) throw error;
}

export async function listSbtiPathways(organizationId: string): Promise<SbtiPathwayRecord[]> {
  const { data, error } = await supabase
    .from('sbti_pathways')
    .select('id, sector, target_type, baseline_year, target_year, pathway_data, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteSbtiPathway(id: string) {
  const { error } = await supabase.from('sbti_pathways').delete().eq('id', id);
  if (error) throw error;
}

// ---- CDP questionnaire responses ----

export async function saveCdpResponses(organizationId: string, responses: CdpAutoFillResponse[]) {
  const rows = responses.map((r) => ({
    organization_id: organizationId,
    question_code: r.code,
    response: (r.response ?? {}) as unknown as Json,
    auto_filled: r.autoFilled,
  }));
  // One row per question code per org - upsert so re-saving refreshes rather than duplicates.
  const { error } = await supabase
    .from('cdp_questionnaire_responses')
    .upsert(rows, { onConflict: 'organization_id,question_code' });
  if (error) throw error;
}

export interface CdpResponseRecord {
  id: string;
  question_code: string;
  response: unknown;
  auto_filled: boolean;
  updated_at: string;
}

export async function listCdpResponses(organizationId: string): Promise<CdpResponseRecord[]> {
  const { data, error } = await supabase
    .from('cdp_questionnaire_responses')
    .select('id, question_code, response, auto_filled, updated_at')
    .eq('organization_id', organizationId)
    .order('question_code', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---- GLEC transport factors ----

export interface GlecRecord {
  id: string;
  payload: unknown;
  created_at: string;
}

export async function saveGlecCalculation(
  organizationId: string,
  mode: TransportMode,
  distanceKm: number,
  weightTonnes: number,
  result: GlecTransportResult,
) {
  const { error } = await supabase.from('glec_transport_factors').insert([{
    organization_id: organizationId,
    payload: { mode, distanceKm, weightTonnes, result } as unknown as Json,
  }]);
  if (error) throw error;
}

export async function listGlecCalculations(organizationId: string): Promise<GlecRecord[]> {
  const { data, error } = await supabase
    .from('glec_transport_factors')
    .select('id, payload, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteGlecCalculation(id: string) {
  const { error } = await supabase.from('glec_transport_factors').delete().eq('id', id);
  if (error) throw error;
}

// ---- LCA assessments ----

export interface LcaRecord {
  id: string;
  payload: unknown;
  created_at: string;
}

export async function saveLcaAssessment(
  organizationId: string,
  gwpResult: LcaImpactAssessmentResult,
  odpResult: OdpAssessmentResult,
  apResult: ApAssessmentResult,
) {
  const { error } = await supabase.from('lca_assessments').insert([{
    organization_id: organizationId,
    payload: { gwp: gwpResult, odp: odpResult, ap: apResult } as unknown as Json,
  }]);
  if (error) throw error;
}

export async function listLcaAssessments(organizationId: string): Promise<LcaRecord[]> {
  const { data, error } = await supabase
    .from('lca_assessments')
    .select('id, payload, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteLcaAssessment(id: string) {
  const { error } = await supabase.from('lca_assessments').delete().eq('id', id);
  if (error) throw error;
}

// ---- GPC city inventories ----

export interface GpcRecord {
  id: string;
  payload: unknown;
  created_at: string;
}

export async function saveGpcInventory(organizationId: string, result: GpcAggregationResult) {
  const { error } = await supabase.from('gpc_city_inventories').insert([{
    organization_id: organizationId,
    payload: result as unknown as Json,
  }]);
  if (error) throw error;
}

export async function listGpcInventories(organizationId: string): Promise<GpcRecord[]> {
  const { data, error } = await supabase
    .from('gpc_city_inventories')
    .select('id, payload, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteGpcInventory(id: string) {
  const { error } = await supabase.from('gpc_city_inventories').delete().eq('id', id);
  if (error) throw error;
}

// ---- Framework indicator mapping (GRI, CSRD - both read/write compliance_scores) ----

/** Fetches an organization's most recent esg_indicators row, or null if it has never reported. */
export async function fetchLatestEsgIndicators(organizationId: string): Promise<EsgIndicatorsRow | null> {
  const { data, error } = await supabase
    .from('esg_indicators')
    .select('carbon_scope1_tonnes, carbon_scope2_tonnes, carbon_scope3_tonnes, energy_consumption_kwh, water_consumption_m3, waste_generated_tonnes, renewable_energy_percentage, community_investment')
    .eq('organization_id', organizationId)
    .order('reporting_year', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Fetches the seeded indicator list for a framework code (e.g. 'GRI', 'CSRD') from reporting_frameworks/framework_indicators. */
export async function fetchFrameworkIndicators(frameworkCode: string): Promise<FrameworkIndicatorSeed[]> {
  const { data: framework, error: fwError } = await supabase
    .from('reporting_frameworks')
    .select('id')
    .eq('code', frameworkCode)
    .maybeSingle();
  if (fwError) throw fwError;
  if (!framework) return [];

  const { data, error } = await supabase
    .from('framework_indicators')
    .select('indicator_code, indicator_name, description, unit_of_measure, metric_key')
    .eq('framework_id', framework.id)
    .order('indicator_code');
  if (error) throw error;
  return data ?? [];
}

/** Upserts a framework mapping result into compliance_scores (one row per org+framework). */
export async function saveComplianceScore(organizationId: string, result: FrameworkMappingResult) {
  const { error } = await supabase.from('compliance_scores').upsert(
    {
      organization_id: organizationId,
      framework_code: result.frameworkCode,
      score_percentage: result.completenessPercentage,
      total_indicators: result.trackableCount,
      reported_indicators: result.satisfiedCount,
      gaps: result.indicators.filter((i) => i.dataAvailable && !i.satisfied).map((i) => ({ code: i.indicatorCode, name: i.indicatorName })) as unknown as Json,
      assessed_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,framework_code' },
  );
  if (error) throw error;
}

export interface ComplianceScoreRecord {
  id: string;
  framework_code: string;
  score_percentage: number;
  total_indicators: number;
  reported_indicators: number;
  gaps: unknown;
  assessed_at: string;
}

export async function getComplianceScore(organizationId: string, frameworkCode: string): Promise<ComplianceScoreRecord | null> {
  const { data, error } = await supabase
    .from('compliance_scores')
    .select('id, framework_code, score_percentage, total_indicators, reported_indicators, gaps, assessed_at')
    .eq('organization_id', organizationId)
    .eq('framework_code', frameworkCode)
    .maybeSingle();
  if (error) throw error;
  return data;
}
