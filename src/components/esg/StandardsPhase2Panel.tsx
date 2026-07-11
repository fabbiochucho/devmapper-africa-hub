import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { SBTI_SECTORS, computeSbtiPathway, type SbtiTemperatureScenario } from '@/lib/sbti-pathways';
import { VERRA_METHODOLOGIES, assessVerraEligibility, type AfoluRiskRating } from '@/lib/verra-methodologies';
import { CDP_QUESTIONS, autoFillCdpResponses, computeCdpReadiness } from '@/lib/cdp-questionnaire';
import {
  estimateGlecTransportEmissions,
  type TransportMode, type RoadVehicleClass, type RailTraction, type SeaVesselClass, type AirCargoClass,
} from '@/lib/glec-transport';
import { LCA_STAGES, characterizeInventory, characterizeOdpInventory, characterizeAcidificationInventory } from '@/lib/lca-lifecycle';
import { summarizeGpcInventory, type GpcSectorEmissions } from '@/lib/gpc-city-aggregation';
import {
  saveSbtiPathway, listSbtiPathways, deleteSbtiPathway, type SbtiPathwayRecord,
  saveCdpResponses, listCdpResponses, type CdpResponseRecord,
  saveGlecCalculation, listGlecCalculations, deleteGlecCalculation, type GlecRecord,
  saveLcaAssessment, listLcaAssessments, deleteLcaAssessment, type LcaRecord,
  saveGpcInventory, listGpcInventories, deleteGpcInventory, type GpcRecord,
  fetchLatestEsgIndicators, fetchFrameworkIndicators, saveComplianceScore, getComplianceScore, type ComplianceScoreRecord,
} from '@/lib/standards-persistence';
import { mapEsgIndicatorsToFramework, type EsgIndicatorsRow, type FrameworkIndicatorSeed } from '@/lib/framework-indicator-mapping';

interface StandardsPhase2PanelProps {
  organizationId: string;
}

interface EsgSnapshot {
  carbon_scope1_tonnes: number | null;
  carbon_scope2_tonnes: number | null;
  carbon_scope3_tonnes: number | null;
  renewable_energy_percentage: number | null;
  verification_status: string | null;
}

/**
 * "Standards" tab on the ESG page. Each sub-tab wires real methodology
 * logic (see src/lib/{sbti-pathways,verra-methodologies,cdp-questionnaire,
 * glec-transport,lca-lifecycle,gpc-city-aggregation}.ts) to actual
 * organization data where available, and persists results to the matching
 * table (see src/lib/standards-persistence.ts). Every module carries its
 * own TODO(business-logic) notes on precisely what's unverified/incomplete.
 */
export default function StandardsPhase2Panel({ organizationId }: StandardsPhase2PanelProps) {
  const [esg, setEsg] = useState<EsgSnapshot | null>(null);
  const [hasActiveTarget, setHasActiveTarget] = useState(false);
  const [sbtiSector, setSbtiSector] = useState(SBTI_SECTORS[0].sector);
  const [sbtiScenario, setSbtiScenario] = useState<SbtiTemperatureScenario>('1.5C');
  const [sbtiTargetYear, setSbtiTargetYear] = useState(new Date().getFullYear() + 7);
  const [verraRisk, setVerraRisk] = useState<AfoluRiskRating>('medium');
  const [glecMode, setGlecMode] = useState<TransportMode>('road');
  const [glecDistance, setGlecDistance] = useState('500');
  const [glecWeight, setGlecWeight] = useState('10');
  const [glecRoadClass, setGlecRoadClass] = useState<RoadVehicleClass>('articulated_34_40t');
  const [glecRailTraction, setGlecRailTraction] = useState<RailTraction>('diesel');
  const [glecSeaClass, setGlecSeaClass] = useState<SeaVesselClass>('bulk_medium_60_100kdwt');
  const [glecAirClass, setGlecAirClass] = useState<AirCargoClass>('belly_cargo_long_haul');

  const [sbtiRecords, setSbtiRecords] = useState<SbtiPathwayRecord[]>([]);
  const [cdpRecords, setCdpRecords] = useState<CdpResponseRecord[]>([]);
  const [glecRecords, setGlecRecords] = useState<GlecRecord[]>([]);
  const [lcaRecords, setLcaRecords] = useState<LcaRecord[]>([]);
  const [gpcRecords, setGpcRecords] = useState<GpcRecord[]>([]);
  const [csrdIndicators, setCsrdIndicators] = useState<FrameworkIndicatorSeed[]>([]);
  const [csrdEsgRow, setCsrdEsgRow] = useState<EsgIndicatorsRow | null>(null);
  const [csrdSavedScore, setCsrdSavedScore] = useState<ComplianceScoreRecord | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const refreshSbti = () => listSbtiPathways(organizationId).then(setSbtiRecords).catch(() => {});
  const refreshCdp = () => listCdpResponses(organizationId).then(setCdpRecords).catch(() => {});
  const refreshGlec = () => listGlecCalculations(organizationId).then(setGlecRecords).catch(() => {});
  const refreshLca = () => listLcaAssessments(organizationId).then(setLcaRecords).catch(() => {});
  const refreshGpc = () => listGpcInventories(organizationId).then(setGpcRecords).catch(() => {});
  const refreshCsrd = () => getComplianceScore(organizationId, 'CSRD').then(setCsrdSavedScore).catch(() => {});

  useEffect(() => {
    supabase
      .from('esg_indicators')
      .select('carbon_scope1_tonnes, carbon_scope2_tonnes, carbon_scope3_tonnes, renewable_energy_percentage, verification_status')
      .eq('organization_id', organizationId)
      .order('reporting_year', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setEsg(data));

    // corporate_targets is keyed by company_id -> profiles.user_id (an
    // older, user-centric data model that predates the org-centric ESG
    // system this panel lives in) rather than organization_id directly.
    // Bridge via organizations.created_by, the closest real link between
    // the two: does the org's creator have any non-completed target?
    supabase
      .from('organizations')
      .select('created_by')
      .eq('id', organizationId)
      .maybeSingle()
      .then(({ data: org }) => {
        if (!org?.created_by) return;
        supabase
          .from('corporate_targets')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', org.created_by)
          .neq('status', 'completed')
          .then(({ count }) => setHasActiveTarget((count ?? 0) > 0));
      });

    fetchFrameworkIndicators('CSRD').then(setCsrdIndicators).catch(() => {});
    fetchLatestEsgIndicators(organizationId).then(setCsrdEsgRow).catch(() => {});

    refreshSbti();
    refreshCdp();
    refreshGlec();
    refreshLca();
    refreshGpc();
    refreshCsrd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const baselineYear = new Date().getFullYear();
  const baselineEmissions = (esg?.carbon_scope1_tonnes ?? 0) + (esg?.carbon_scope2_tonnes ?? 0);

  const sbtiPathway = useMemo(
    () => computeSbtiPathway({
      baselineYear,
      targetYear: sbtiTargetYear,
      baselineEmissions: baselineEmissions || 100,
      targetType: 'near_term',
      temperatureScenario: sbtiScenario,
    }),
    [baselineYear, sbtiTargetYear, baselineEmissions, sbtiScenario],
  );

  const verraAssessment = useMemo(() => assessVerraEligibility('reforestation', verraRisk), [verraRisk]);

  const cdpResponses = useMemo(() => autoFillCdpResponses({
    scope1Tonnes: esg?.carbon_scope1_tonnes ?? null,
    scope2Tonnes: esg?.carbon_scope2_tonnes ?? null,
    scope3Tonnes: esg?.carbon_scope3_tonnes ?? null,
    renewableEnergyPercentage: esg?.renewable_energy_percentage ?? null,
    hasActiveTarget,
    verificationStatus: esg?.verification_status ?? null,
  }), [esg, hasActiveTarget]);
  const cdpReadiness = computeCdpReadiness(cdpResponses);

  const glecResult = useMemo(() => estimateGlecTransportEmissions({
    mode: glecMode,
    distanceKm: parseFloat(glecDistance) || 0,
    weightTonnes: parseFloat(glecWeight) || 0,
    roadVehicleClass: glecRoadClass,
    railTraction: glecRailTraction,
    seaVesselClass: glecSeaClass,
    airCargoClass: glecAirClass,
  }), [glecMode, glecDistance, glecWeight, glecRoadClass, glecRailTraction, glecSeaClass, glecAirClass]);

  const lcaGwpResult = useMemo(() => characterizeInventory([
    { substance: 'co2', amountKg: baselineEmissions * 1000, direction: 'output', stage: 'use' },
  ]), [baselineEmissions]);

  const lcaOdpResult = useMemo(() => characterizeOdpInventory([]), []);
  const lcaApResult = useMemo(() => characterizeAcidificationInventory([]), []);

  const csrdMapping = useMemo(
    () => mapEsgIndicatorsToFramework('CSRD', csrdIndicators, csrdEsgRow, baselineYear),
    [csrdIndicators, csrdEsgRow, baselineYear],
  );

  const gpcSummary = useMemo(() => {
    const gpcExample: GpcSectorEmissions[] = [
      { sector: 'stationary_energy', scope: 1, emissionsTonnesCo2e: esg?.carbon_scope1_tonnes ?? null, notationKey: esg?.carbon_scope1_tonnes == null ? 'NE' : undefined },
      { sector: 'stationary_energy', scope: 2, emissionsTonnesCo2e: esg?.carbon_scope2_tonnes ?? null, notationKey: esg?.carbon_scope2_tonnes == null ? 'NE' : undefined },
    ];
    return summarizeGpcInventory(gpcExample);
  }, [esg]);

  const withSaving = async (key: string, fn: () => Promise<void>, refresh: () => void) => {
    setSaving(key);
    try {
      await fn();
      toast.success('Saved');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standards (Beta)</CardTitle>
        <CardDescription>
          CDP, SBTi, Verra/Gold Standard, GLEC, LCA, and GPC — real published methodology where it's publicly specifiable, clearly flagged where a piece requires a live sandbox, licensed dataset, or expert review. Results can be saved per organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sbti">
          <TabsList>
            <TabsTrigger value="sbti">SBTi</TabsTrigger>
            <TabsTrigger value="verra">Verra/GS</TabsTrigger>
            <TabsTrigger value="cdp">CDP</TabsTrigger>
            <TabsTrigger value="csrd">CSRD</TabsTrigger>
            <TabsTrigger value="glec">GLEC</TabsTrigger>
            <TabsTrigger value="lca">LCA</TabsTrigger>
            <TabsTrigger value="gpc">GPC</TabsTrigger>
          </TabsList>

          {/* SBTi */}
          <TabsContent value="sbti" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Sector</Label>
                <Select value={sbtiSector} onValueChange={setSbtiSector}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SBTI_SECTORS.map((s) => <SelectItem key={s.sector} value={s.sector}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Temperature scenario</Label>
                <Select value={sbtiScenario} onValueChange={(v) => setSbtiScenario(v as SbtiTemperatureScenario)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.5C">1.5°C (4.2%/yr)</SelectItem>
                    <SelectItem value="well_below_2C">Well-below-2°C (2.5%/yr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Target year</Label>
                <Input type="number" value={sbtiTargetYear} onChange={(e) => setSbtiTargetYear(parseInt(e.target.value) || baselineYear)} />
              </div>
            </div>
            {SBTI_SECTORS.find((s) => s.sector === sbtiSector)?.requiresSda && (
              <p className="text-xs text-yellow-600">
                This sector requires SBTi's Sectoral Decarbonization Approach for a fully compliant target. computeSdaPathway() implements the real convergence formula, but needs a licensed sector benchmark intensity as input (see sbti-pathways.ts) — showing the cross-sector Absolute Contraction Approach here instead, which needs no external data.
              </p>
            )}
            <div className="text-sm space-y-1">
              <p>Baseline ({baselineYear}): <span className="font-medium">{Math.round(baselineEmissions || 100).toLocaleString()} tCO2e</span> (Scope 1+2{baselineEmissions === 0 ? ', no ESG data yet — using illustrative 100t baseline' : ''})</p>
              <p>Required annual reduction: <span className="font-medium">{(sbtiPathway.annualReductionRate * 100).toFixed(1)}%/yr</span></p>
              <p>Within SBTi's recommended 5-10 year horizon: <Badge variant={sbtiPathway.withinRecommendedHorizon ? 'default' : 'destructive'}>{sbtiPathway.withinRecommendedHorizon ? 'Yes' : 'No'}</Badge></p>
            </div>
            <div className="text-xs text-muted-foreground">
              {sbtiPathway.points.map((p) => `${p.year}: ${p.emissions.toLocaleString()}t`).join(' → ')}
            </div>
            <Button
              size="sm"
              disabled={saving === 'sbti'}
              onClick={() => withSaving('sbti', () => saveSbtiPathway(organizationId, sbtiSector, 'near_term', baselineYear, sbtiTargetYear, sbtiPathway), refreshSbti)}
            >
              <Save className="w-3 h-3 mr-1" />{saving === 'sbti' ? 'Saving…' : 'Save pathway'}
            </Button>

            {sbtiRecords.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Saved pathways</p>
                {sbtiRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span>{r.sector} — {r.baseline_year}→{r.target_year} ({r.target_type})</span>
                    <Button size="icon" variant="ghost" onClick={() => deleteSbtiPathway(r.id).then(refreshSbti)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Verra/GS */}
          <TabsContent value="verra" className="space-y-4 pt-4">
            <ul className="text-sm space-y-1">
              {VERRA_METHODOLOGIES.map((m) => (
                <li key={m.methodologyCode}>
                  <span className="font-medium">{m.projectType}</span> — {m.methodologyCode}: {m.description}{' '}
                  <Badge variant="outline" className="text-xs">{m.confidence}</Badge>
                </li>
              ))}
            </ul>
            <div className="space-y-1 max-w-xs">
              <Label>AFOLU non-permanence risk rating</Label>
              <Select value={verraRisk} onValueChange={(v) => setVerraRisk(v as AfoluRiskRating)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm space-y-1">
              <p>Buffer pool contribution range: <span className="font-medium">{verraAssessment.bufferPoolRange?.min}–{verraAssessment.bufferPoolRange?.max}%</span> of issued credits</p>
              <p>Verification cycle: every <span className="font-medium">{verraAssessment.verificationCycleYears} years</span></p>
              <p className="text-xs text-muted-foreground">{verraAssessment.monitoringPeriodNote}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Verra methodology mappings are a shared reference registry (verra_methodology_mappings table), not per-organization data — nothing to save here per-org.
            </p>
          </TabsContent>

          {/* CDP */}
          <TabsContent value="cdp" className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <Progress value={cdpReadiness.percentage} className="flex-1" />
              <span className="text-sm font-medium">{cdpReadiness.answered}/{cdpReadiness.total} auto-filled</span>
            </div>
            <ul className="text-sm space-y-1">
              {CDP_QUESTIONS.map((q) => {
                const r = cdpResponses.find((resp) => resp.code === q.code);
                return (
                  <li key={q.code} className="flex items-center justify-between gap-2">
                    <span><span className="font-medium">{q.code}</span> ({q.sectionLabel}): {q.question}</span>
                    <Badge variant={r?.autoFilled ? 'default' : 'outline'} className="shrink-0 text-xs">
                      {r?.autoFilled ? 'Auto-filled' : 'Missing data'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            <Button
              size="sm"
              disabled={saving === 'cdp'}
              onClick={() => withSaving('cdp', () => saveCdpResponses(organizationId, cdpResponses), refreshCdp)}
            >
              <Save className="w-3 h-3 mr-1" />{saving === 'cdp' ? 'Saving…' : 'Save responses'}
            </Button>
            {cdpRecords.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Saved responses ({cdpRecords.length})</p>
                <p className="text-xs text-muted-foreground">Last saved: {new Date(cdpRecords[0]?.updated_at).toLocaleString()}</p>
              </div>
            )}
          </TabsContent>

          {/* CSRD */}
          <TabsContent value="csrd" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Maps this organization's reported ESG data against the 5 ESRS indicators seeded for CSRD (public.framework_indicators). Some CSRD indicators (workforce/social disclosures) aren't tracked by this schema at all — those are excluded from the completeness % rather than counted as gaps, since this system has no data source for them.
            </p>
            <div className="flex items-center gap-3">
              <Progress value={csrdMapping.completenessPercentage} className="flex-1" />
              <span className="text-sm font-medium">{csrdMapping.completenessPercentage}% ({csrdMapping.satisfiedCount}/{csrdMapping.trackableCount} trackable indicators)</span>
            </div>
            <ul className="text-sm space-y-1">
              {csrdMapping.indicators.map((i) => (
                <li key={i.indicatorCode} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{i.indicatorCode}</span>: {i.indicatorName}
                    {i.dataAvailable && i.reportedValue != null && (
                      <span className="text-muted-foreground"> — {i.reportedValue.toLocaleString()} {i.unitOfMeasure}</span>
                    )}
                  </span>
                  <Badge variant={!i.dataAvailable ? 'outline' : i.satisfied ? 'default' : 'destructive'} className="shrink-0 text-xs">
                    {!i.dataAvailable ? 'Not tracked by this system' : i.satisfied ? 'Reported' : 'Gap'}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              disabled={saving === 'csrd'}
              onClick={() => withSaving('csrd', () => saveComplianceScore(organizationId, csrdMapping), refreshCsrd)}
            >
              <Save className="w-3 h-3 mr-1" />{saving === 'csrd' ? 'Saving…' : 'Save compliance score'}
            </Button>
            {csrdSavedScore && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Last saved: {csrdSavedScore.score_percentage}% ({csrdSavedScore.reported_indicators}/{csrdSavedScore.total_indicators}) on {new Date(csrdSavedScore.assessed_at).toLocaleString()}
              </p>
            )}
          </TabsContent>

          {/* GLEC */}
          <TabsContent value="glec" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Mode</Label>
                <Select value={glecMode} onValueChange={(v) => setGlecMode(v as TransportMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road">Road</SelectItem>
                    <SelectItem value="rail">Rail</SelectItem>
                    <SelectItem value="sea">Sea</SelectItem>
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="inland_waterway">Inland Waterway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {glecMode === 'road' && (
                <div className="space-y-1">
                  <Label>Vehicle class</Label>
                  <Select value={glecRoadClass} onValueChange={(v) => setGlecRoadClass(v as RoadVehicleClass)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rigid_12_20t">Rigid truck, 12-20t</SelectItem>
                      <SelectItem value="articulated_18_27t">Articulated, 18-27t</SelectItem>
                      <SelectItem value="articulated_34_40t">Articulated, 34-40t</SelectItem>
                      <SelectItem value="articulated_49t_plus">Articulated, &gt;49t</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {glecMode === 'rail' && (
                <div className="space-y-1">
                  <Label>Traction</Label>
                  <Select value={glecRailTraction} onValueChange={(v) => setGlecRailTraction(v as RailTraction)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {glecMode === 'sea' && (
                <div className="space-y-1">
                  <Label>Vessel class</Label>
                  <Select value={glecSeaClass} onValueChange={(v) => setGlecSeaClass(v as SeaVesselClass)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulk_small_0_10kdwt">Bulk carrier, 0-10k dwt</SelectItem>
                      <SelectItem value="bulk_medium_60_100kdwt">Bulk carrier, 60-100k dwt</SelectItem>
                      <SelectItem value="bulk_large_200kdwt_plus">Bulk carrier, &gt;200k dwt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {glecMode === 'air' && (
                <div className="space-y-1">
                  <Label>Cargo class</Label>
                  <Select value={glecAirClass} onValueChange={(v) => setGlecAirClass(v as AirCargoClass)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freighter_short_haul">Freighter, short-haul</SelectItem>
                      <SelectItem value="freighter_long_haul">Freighter, long-haul</SelectItem>
                      <SelectItem value="belly_cargo_long_haul">Belly cargo, long-haul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label>Distance (km)</Label>
                <Input type="number" value={glecDistance} onChange={(e) => setGlecDistance(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Weight (tonnes)</Label>
                <Input type="number" value={glecWeight} onChange={(e) => setGlecWeight(e.target.value)} />
              </div>
            </div>
            <p className="text-sm">Estimated emissions: <span className="font-medium">{glecResult.emissionsKgCo2e.toLocaleString()} kgCO2e</span> ({glecResult.classUsed})</p>
            <p className="text-xs text-muted-foreground">{glecResult.note}</p>
            <Button
              size="sm"
              disabled={saving === 'glec'}
              onClick={() => withSaving('glec', () => saveGlecCalculation(organizationId, glecMode, parseFloat(glecDistance) || 0, parseFloat(glecWeight) || 0, glecResult), refreshGlec)}
            >
              <Save className="w-3 h-3 mr-1" />{saving === 'glec' ? 'Saving…' : 'Save calculation'}
            </Button>
            {glecRecords.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Saved calculations</p>
                {glecRecords.map((r) => {
                  const p = r.payload as any;
                  return (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span>{p?.mode}: {p?.distanceKm}km × {p?.weightTonnes}t → {p?.result?.emissionsKgCo2e?.toLocaleString()} kgCO2e</span>
                      <Button size="icon" variant="ghost" onClick={() => deleteGlecCalculation(r.id).then(refreshGlec)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* LCA */}
          <TabsContent value="lca" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-1">
              {LCA_STAGES.map((stage) => (
                <Badge key={stage} variant="outline">{stage.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
            <p className="text-sm">
              GWP100 characterization of the org's Scope 1+2 baseline as a single CO2 flow:{' '}
              <span className="font-medium">{lcaGwpResult.totalKgCo2e.toLocaleString()} kgCO2e</span>
            </p>
            <p className="text-xs text-muted-foreground">{lcaGwpResult.note}</p>
            <Separator />
            <p className="text-sm">
              Ozone Depletion Potential (no ODS flows entered — 0 by default):{' '}
              <span className="font-medium">{lcaOdpResult.totalKgCfc11e} kg CFC-11-eq</span>
            </p>
            <p className="text-xs text-muted-foreground">{lcaOdpResult.note}</p>
            <Separator />
            <p className="text-sm">
              Acidification Potential (no acidifying flows entered — 0 by default):{' '}
              <span className="font-medium">{lcaApResult.totalKgSo2e} kg SO2-eq</span>
            </p>
            <p className="text-xs text-muted-foreground">{lcaApResult.note}</p>
            <Button
              size="sm"
              disabled={saving === 'lca'}
              onClick={() => withSaving('lca', () => saveLcaAssessment(organizationId, lcaGwpResult, lcaOdpResult, lcaApResult), refreshLca)}
            >
              <Save className="w-3 h-3 mr-1" />{saving === 'lca' ? 'Saving…' : 'Save assessment'}
            </Button>
            {lcaRecords.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Saved assessments</p>
                {lcaRecords.map((r) => {
                  const p = r.payload as any;
                  return (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span>{new Date(r.created_at).toLocaleDateString()}: {p?.gwp?.totalKgCo2e?.toLocaleString()} kgCO2e, {p?.odp?.totalKgCfc11e} kg CFC-11-eq, {p?.ap?.totalKgSo2e ?? 0} kg SO2-eq</span>
                      <Button size="icon" variant="ghost" onClick={() => deleteLcaAssessment(r.id).then(refreshLca)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* GPC */}
          <TabsContent value="gpc" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground text-xs">BASIC level</p>
                <p className="font-medium">{gpcSummary.byLevel.BASIC.toLocaleString()} tCO2e</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-muted-foreground text-xs">BASIC+ level</p>
                <p className="font-medium">{gpcSummary.byLevel['BASIC+'].toLocaleString()} tCO2e</p>
              </div>
            </div>
            {gpcSummary.missingRequiredEntries.length > 0 && (
              <p className="text-xs text-yellow-600">
                {gpcSummary.missingRequiredEntries.length} required sector/scope combination(s) not yet reported (eg. Transportation, Waste — this demo only wires Stationary Energy from ESG indicators).
              </p>
            )}
            <Button
              size="sm"
              disabled={saving === 'gpc'}
              onClick={() => withSaving('gpc', () => saveGpcInventory(organizationId, gpcSummary), refreshGpc)}
            >
              <Save className="w-3 h-3 mr-1" />{saving === 'gpc' ? 'Saving…' : 'Save inventory'}
            </Button>
            {gpcRecords.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Saved inventories</p>
                {gpcRecords.map((r) => {
                  const p = r.payload as any;
                  return (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span>{new Date(r.created_at).toLocaleDateString()}: BASIC {p?.byLevel?.BASIC?.toLocaleString()}t, BASIC+ {p?.byLevel?.['BASIC+']?.toLocaleString()}t</span>
                      <Button size="icon" variant="ghost" onClick={() => deleteGpcInventory(r.id).then(refreshGpc)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
