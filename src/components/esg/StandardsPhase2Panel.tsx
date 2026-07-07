import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { SBTI_SECTORS } from '@/lib/sbti-pathways';
import { VERRA_METHODOLOGIES } from '@/lib/verra-methodologies';

interface StandardsPhase2PanelProps {
  organizationId: string;
}

/**
 * Thin UI stub for Standards Engine Phase 2/3 (CDP, SBTi, Verra, GLEC, LCA,
 * GPC). Wired to the real (mostly empty) tables so the data model gets
 * exercised, but the underlying logic is intentionally minimal - this is
 * the lowest-priority item of this pass, scaffolded rather than deeply
 * built out.
 */
export default function StandardsPhase2Panel({ organizationId }: StandardsPhase2PanelProps) {
  const [sbtiCount, setSbtiCount] = useState(0);
  const [cdpCount, setCdpCount] = useState(0);

  useEffect(() => {
    supabase.from('sbti_pathways').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId)
      .then(({ count }) => setSbtiCount(count ?? 0));
    supabase.from('cdp_questionnaire_responses').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId)
      .then(({ count }) => setCdpCount(count ?? 0));
  }, [organizationId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standards (Beta)</CardTitle>
        <CardDescription>
          Early scaffolding for CDP, SBTi, Verra/Gold Standard, GLEC, LCA, and GPC — schema and reference data only, full workflows coming later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sbti">
          <TabsList>
            <TabsTrigger value="sbti">SBTi</TabsTrigger>
            <TabsTrigger value="verra">Verra/GS</TabsTrigger>
            <TabsTrigger value="cdp">CDP</TabsTrigger>
            <TabsTrigger value="phase3">GLEC / LCA / GPC</TabsTrigger>
          </TabsList>

          <TabsContent value="sbti" className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              {sbtiCount} pathway(s) saved for this organization.
            </p>
            <div className="flex flex-wrap gap-1">
              {SBTI_SECTORS.map((s) => (
                <Badge key={s.sector} variant="outline" title={s.description}>{s.label}</Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="verra" className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">Reference methodology mapping by project type:</p>
            <ul className="text-sm space-y-1">
              {VERRA_METHODOLOGIES.map((m) => (
                <li key={m.methodologyCode}>
                  <span className="font-medium">{m.projectType}</span> — {m.methodologyCode}: {m.description}
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="cdp" className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              {cdpCount} questionnaire response(s) on file. Auto-fill from ESG indicators is planned but not yet built.
            </p>
          </TabsContent>

          <TabsContent value="phase3" className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              GLEC transport, ISO 14040/44 LCA, and GPC city aggregation are Phase 3 items — data model exists, no computation logic yet.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
