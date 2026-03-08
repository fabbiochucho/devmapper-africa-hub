import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Shield, BookOpen, Target, Award, BarChart3, Layers, Globe, CheckCircle2 } from 'lucide-react';
import {
  SPVF_STANDARDS,
  CORE_PRINCIPLES,
  VERIFICATION_STAGES,
  DIMENSION_DESCRIPTIONS,
  SIS_WEIGHTS,
  RATING_CONFIG,
  RATING_THRESHOLDS,
  EVIDENCE_TYPE_WEIGHTS,
} from '@/lib/spvf-engine';
import { SEOHead } from '@/components/seo/SEOHead';

const SPVFStandards = () => {
  return (
    <>
      <SEOHead
        title="SPVF Standards | DevMapper SDG Verification"
        description="The Standardized SDG Project Verification Framework (SPVF) — SDG-PVS 1000. A global standard for verifying Sustainable Development Goal projects."
      />
      <div className="container max-w-4xl mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            SDG Project Verification Framework
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SDG-PVS 1000 — A global standard for registering, verifying, scoring, and certifying Sustainable Development Goal projects worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline">Aligned with UN SDG Indicators</Badge>
            <Badge variant="outline">GRI Standards</Badge>
            <Badge variant="outline">OECD DAC Criteria</Badge>
            <Badge variant="outline">ISO Impact Standards</Badge>
          </div>
        </div>

        {/* Standard Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Standard Structure</CardTitle>
            <CardDescription>The SPVF is organized into modular standard codes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SPVF_STANDARDS.map(s => (
                  <TableRow key={s.code}>
                    <TableCell className="font-mono font-semibold">{s.code}</TableCell>
                    <TableCell>{s.title}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Core Principles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Core Principles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CORE_PRINCIPLES.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{i + 1}. {p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 7-Stage Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" />The 7-Stage Verification Process</CardTitle>
            <CardDescription>Every project progresses through these sequential verification stages</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {VERIFICATION_STAGES.map((stage) => (
                <AccordionItem key={stage.key} value={stage.key}>
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium text-sm text-left">{stage.label}</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pl-4">
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                    <div>
                      <p className="text-xs font-semibold mb-1">Verification Checks:</p>
                      <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                        {stage.checks.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* SDG Impact Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />SDG Impact Score (SIS)</CardTitle>
            <CardDescription>
              The automated scoring algorithm calculates a weighted score across 7 dimensions. Maximum score = 100.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <p>SIS = (SDG Alignment × 0.15) + (Evidence Strength × 0.20)</p>
              <p className="pl-8">+ (Implementation Integrity × 0.15) + (Output Delivery × 0.15)</p>
              <p className="pl-8">+ (Outcome Achievement × 0.20) + (Sustainability × 0.10)</p>
              <p className="pl-8">+ (Community Validation × 0.05)</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimension</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(DIMENSION_DESCRIPTIONS).map(([key, dim]) => (
                  <TableRow key={key}>
                    <TableCell className="font-semibold text-sm">{dim.label}</TableCell>
                    <TableCell><Badge variant="outline">{dim.weight}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{dim.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Certification Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Certification & Rating Levels</CardTitle>
            <CardDescription>Projects receive a certification rating based on their SDG Impact Score</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rating</TableHead>
                  <TableHead>Score Range</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(RATING_CONFIG).map(([key, cfg]) => {
                  const threshold = RATING_THRESHOLDS[key as keyof typeof RATING_THRESHOLDS];
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <span className="font-semibold text-sm">{cfg.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {threshold ? `${threshold}–100` : '< 60'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cfg.description}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Evidence Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Evidence Requirements</CardTitle>
            <CardDescription>Projects must submit at least 3 forms of evidence for each claim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="font-semibold text-sm">Documentary</p>
                  <p className="text-xs text-muted-foreground">Reports, contracts, financial records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="font-semibold text-sm">Physical</p>
                  <p className="text-xs text-muted-foreground">Photos, inspections, satellite imagery</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="font-semibold text-sm">Testimonial</p>
                  <p className="text-xs text-muted-foreground">Beneficiary interviews, community validation</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold mb-2">Evidence Type Scoring Weights:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(EVIDENCE_TYPE_WEIGHTS).map(([type, weight]) => (
                  <div key={type} className="flex justify-between border rounded p-2 text-xs">
                    <span className="capitalize">{type}</span>
                    <span className="font-mono font-semibold">{weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governance */}
        <Card>
          <CardHeader>
            <CardTitle>Governance & Strategic Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              DevMapper implements the SPVF as the global infrastructure for SDG verification, comparable to how MSCI rates ESG investments, Moody's rates financial risk, and the Gold Standard Foundation verifies carbon credits — but focused on development impact.
            </p>
            <p>
              The governance model includes a Global SDG Verification Council, accredited verification bodies, national verification nodes, and a public transparency dashboard ensuring full accountability.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {['Governments', 'NGOs', 'Impact Investors', 'Development Banks'].map(u => (
                <Badge key={u} variant="secondary" className="justify-center">{u}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SPVFStandards;
