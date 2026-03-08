import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Target, ClipboardList, Handshake, Rocket, BarChart3, Award, BookOpen, Users, Globe, CheckCircle } from 'lucide-react';
import { DSPM_PHASES, DSPM_COMPETENCIES, IMPACT_MEASUREMENT_LEVELS, FRAMEWORK_ALIGNMENTS, DISM_DIMENSION_DETAILS, DISM_RATING_CONFIG, VERIFICATION_LEVELS, IMPACT_CATEGORIES, type DISMRating } from '@/lib/dism-engine';
import { getIndicatorLibraryStats } from '@/data/sdgIndicatorLibrary';
import { getTaxonomyStats } from '@/data/sdgTaxonomy';
import { SEOHead } from '@/components/seo/SEOHead';

const PHASE_ICONS: Record<number, React.ReactNode> = {
  1: <Search className="h-5 w-5" />, 2: <Target className="h-5 w-5" />,
  3: <ClipboardList className="h-5 w-5" />, 4: <Handshake className="h-5 w-5" />,
  5: <Rocket className="h-5 w-5" />, 6: <BarChart3 className="h-5 w-5" />,
  7: <Award className="h-5 w-5" />,
};

export default function DSPMMethodology() {
  const indicatorStats = getIndicatorLibraryStats();
  const taxonomyStats = getTaxonomyStats();

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      <SEOHead title="DSPM Methodology — DevMapper" description="The DevMapper SDG Project Methodology: a global standard for SDG, ESG, CSR, and social impact projects." />

      {/* Hero */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm">Global Standard</Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">DevMapper SDG Project Methodology</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">A comprehensive framework for planning, implementing, measuring, and verifying sustainable development projects — combining PMI processes, IPMA competencies, and UN development impact thinking.</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '7 Lifecycle Phases', icon: <Rocket className="h-4 w-4" /> },
          { label: `${indicatorStats.total}+ SDG Indicators`, icon: <BarChart3 className="h-4 w-4" /> },
          { label: `${taxonomyStats.totalEntries}+ Taxonomy Entries`, icon: <BookOpen className="h-4 w-4" /> },
          { label: `${FRAMEWORK_ALIGNMENTS.length} Global Frameworks`, icon: <Globe className="h-4 w-4" /> },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10 text-primary">{s.icon}</div><span className="text-sm font-medium text-foreground">{s.label}</span></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="lifecycle" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="lifecycle">7-Phase Lifecycle</TabsTrigger>
          <TabsTrigger value="scoring">DISM Scoring</TabsTrigger>
          <TabsTrigger value="competencies">Competency Framework</TabsTrigger>
          <TabsTrigger value="verification">Verification Protocol</TabsTrigger>
          <TabsTrigger value="frameworks">Global Alignment</TabsTrigger>
        </TabsList>

        {/* ── Lifecycle ── */}
        <TabsContent value="lifecycle" className="space-y-4">
          <p className="text-muted-foreground">The DevMapper lifecycle mirrors PMI rigor with integrated development impact thinking across 7 phases.</p>
          <Accordion type="single" collapsible className="space-y-2">
            {DSPM_PHASES.map(phase => (
              <AccordionItem key={phase.phase} value={`phase-${phase.phase}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">{PHASE_ICONS[phase.phase]}</div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Phase {phase.phase}: {phase.title}</div>
                      <div className="text-sm text-muted-foreground">{phase.purpose}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-3">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><h4 className="font-medium text-foreground mb-2">Key Activities</h4><ul className="space-y-1">{phase.activities.map((a, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><CheckCircle className="h-3 w-3 mt-1 text-primary shrink-0" />{a}</li>)}</ul></div>
                    <div><h4 className="font-medium text-foreground mb-2">Tools</h4><ul className="space-y-1">{phase.tools.map((t, i) => <li key={i} className="text-sm text-muted-foreground">• {t}</li>)}</ul></div>
                    <div><h4 className="font-medium text-foreground mb-2">Outputs</h4><div className="flex flex-wrap gap-1">{phase.outputs.map((o, i) => <Badge key={i} variant="secondary" className="text-xs">{o}</Badge>)}</div></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Impact Measurement Levels */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Impact Measurement Model</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {IMPACT_MEASUREMENT_LEVELS.map((l, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/50">
                    <Badge variant="outline">Level {i + 1}</Badge>
                    <h4 className="font-semibold text-foreground">{l.level}</h4>
                    <p className="text-xs text-muted-foreground">{l.description}</p>
                    <div className="flex flex-wrap gap-1">{l.examples.map((e, j) => <Badge key={j} variant="secondary" className="text-xs">{e}</Badge>)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DISM Scoring ── */}
        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>DevMapper Impact Scoring Model (DISM) — 8 Dimensions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Dimension</TableHead><TableHead>Max Score</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(Object.entries(DISM_DIMENSION_DETAILS) as [string, typeof DISM_DIMENSION_DETAILS[keyof typeof DISM_DIMENSION_DETAILS]][]).map(([, dim]) => (
                    <TableRow key={dim.label}><TableCell className="font-medium text-foreground">{dim.label}</TableCell><TableCell><Badge variant="outline">{dim.maxScore}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{dim.description}</TableCell></TableRow>
                  ))}
                  <TableRow className="font-bold"><TableCell className="text-foreground">Total</TableCell><TableCell><Badge>100</Badge></TableCell><TableCell /></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rating System */}
          <Card>
            <CardHeader><CardTitle>Global SDG Project Rating System (AAA–D)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {(Object.entries(DISM_RATING_CONFIG) as [DISMRating, typeof DISM_RATING_CONFIG[DISMRating]][]).map(([key, cfg]) => (
                  <div key={key} className="p-3 rounded-lg border text-center space-y-1">
                    <div className="text-xl font-bold" style={{ color: cfg.color }}>{key}</div>
                    <div className="text-xs text-muted-foreground">{cfg.category}</div>
                    <Badge variant="outline" className="text-xs">≥{cfg.minScore}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Categories */}
          <Card>
            <CardHeader><CardTitle>Impact Score Interpretation</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {IMPACT_CATEGORIES.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-sm font-medium text-foreground">{c.range}</span>
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Competencies ── */}
        <TabsContent value="competencies" className="space-y-4">
          <p className="text-muted-foreground">Inspired by IPMA ICB4, the DevMapper competency model ensures SDG projects are led by capable individuals across three domains.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(DSPM_COMPETENCIES).map(([key, comp]) => (
              <Card key={key}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{comp.label}</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{comp.items.map((item, i) => <li key={i} className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary" />{item}</li>)}</ul></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Verification Protocol ── */}
        <TabsContent value="verification" className="space-y-4">
          <p className="text-muted-foreground">A credible multi-stage verification framework ensuring project claims are trustworthy and auditable.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {VERIFICATION_LEVELS.map(v => (
              <Card key={v.level}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2"><Badge>Level {v.level}</Badge><span className="font-semibold text-foreground">{v.label}</span></div>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Frameworks ── */}
        <TabsContent value="frameworks" className="space-y-4">
          <p className="text-muted-foreground">The DSPM integrates with leading global development, ESG, and project management frameworks.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {FRAMEWORK_ALIGNMENTS.map((f, i) => (
              <Card key={i}><CardContent className="p-4"><h4 className="font-medium text-foreground">{f.name}</h4><p className="text-sm text-muted-foreground">{f.description}</p></CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
