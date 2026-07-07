import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

import { SBTI_SECTORS, computeSbtiPathway, type SbtiTemperatureScenario } from '@/lib/sbti-pathways';
import { VERRA_METHODOLOGIES, assessVerraEligibility, type AfoluRiskRating } from '@/lib/verra-methodologies';
import { CDP_QUESTIONS, autoFillCdpResponses, computeCdpReadiness } from '@/lib/cdp-questionnaire';
import { estimateGlecTransportEmissions, type TransportMode } from '@/lib/glec-transport';
import { LCA_STAGES, characterizeInventory } from '@/lib/lca-lifecycle';
import { summarizeGpcInventory, type GpcSectorEmissions } from '@/lib/gpc-city-aggregation';

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
 * organization data where available. Every module carries its own
 * TODO(business-logic) notes on precisely what's unverified/incomplete -
 * this panel surfaces that logic working end-to-end, not a mockup.
 */
export default function StandardsPhase2Panel({ organizationId }: StandardsPhase2PanelProps) {
  const [esg, setEsg] = useState<EsgSnapshot | null>(null);
  const [sbtiSector, setSbtiSector] = useState(SBTI_SECTORS[0].sector);
  const [sbtiScenario, setSbtiScenario] = useState<SbtiTemperatureScenario>('1.5C');
  const [sbtiTargetYear, setSbtiTargetYear] = useState(new Date().getFullYear() + 7);
  const [verraRisk, setVerraRisk] = useState<AfoluRiskRating>('medium');
  const [glecMode, setGlecMode] = useState<TransportMode>('road');
  const [glecDistance, setGlecDistance] = useState('500');
  const [glecWeight, setGlecWeight] = useState('10');

  useEffect(() => {
    supabase
      .from('esg_indicators')
      .select('carbon_scope1_tonnes, carbon_scope2_tonnes, carbon_scope3_tonnes, renewable_energy_percentage, verification_status')
      .eq('organization_id', organizationId)
      .order('reporting_year', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setEsg(data));
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
    hasActiveTarget: false,
    verificationStatus: esg?.verification_status ?? null,
  }), [esg]);
  const cdpReadiness = computeCdpReadiness(cdpResponses);

  const glecResult = useMemo(() => estimateGlecTransportEmissions({
    mode: glecMode,
    distanceKm: parseFloat(glecDistance) || 0,
    weightTonnes: parseFloat(glecWeight) || 0,
  }), [glecMode, glecDistance, glecWeight]);

  const lcaExample = useMemo(() => characterizeInventory([
    { substance: 'co2', amountKg: baselineEmissions * 1000, direction: 'output', stage: 'use' },
  ]), [baselineEmissions]);

  const gpcSummary = useMemo(() => {
    const gpcExample: GpcSectorEmissions[] = [
      { sector: 'stationary_energy', scope: 1, emissionsTonnesCo2e: esg?.carbon_scope1_tonnes ?? null, notationKey: esg?.carbon_scope1_tonnes == null ? 'NE' : undefined },
      { sector: 'stationary_energy', scope: 2, emissionsTonnesCo2e: esg?.carbon_scope2_tonnes ?? null, notationKey: esg?.carbon_scope2_tonnes == null ? 'NE' : undefined },
    ];
    return summarizeGpcInventory(gpcExample);
  }, [esg]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standards (Beta)</CardTitle>
        <CardDescription>
          CDP, SBTi, Verra/Gold Standard, GLEC, LCA, and GPC — real published methodology where it's publicly specifiable, clearly flagged where a piece requires a live sandbox, licensed dataset, or expert review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sbti">
          <TabsList>
            <TabsTrigger value="sbti">SBTi</TabsTrigger>
            <TabsTrigger value="verra">Verra/GS</TabsTrigger>
            <TabsTrigger value="cdp">CDP</TabsTrigger>
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
                This sector requires SBTi's Sectoral Decarbonization Approach for a fully compliant target — not implemented here (needs licensed IEA sector data). Showing the cross-sector Absolute Contraction Approach instead.
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
          </TabsContent>

          {/* GLEC */}
          <TabsContent value="glec" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="space-y-1">
                <Label>Distance (km)</Label>
                <Input type="number" value={glecDistance} onChange={(e) => setGlecDistance(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Weight (tonnes)</Label>
                <Input type="number" value={glecWeight} onChange={(e) => setGlecWeight(e.target.value)} />
              </div>
            </div>
            <p className="text-sm">Estimated emissions: <span className="font-medium">{glecResult.emissionsKgCo2e.toLocaleString()} kgCO2e</span></p>
            <p className="text-xs text-muted-foreground">{glecResult.note}</p>
          </TabsContent>

          {/* LCA */}
          <TabsContent value="lca" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-1">
              {LCA_STAGES.map((stage) => (
                <Badge key={stage} variant="outline">{stage.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
            <p className="text-sm">
              Example GWP100 characterization of the org's Scope 1+2 baseline as a single CO2 flow:{' '}
              <span className="font-medium">{lcaExample.totalKgCo2e.toLocaleString()} kgCO2e</span>
            </p>
            <p className="text-xs text-muted-foreground">{lcaExample.note}</p>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
