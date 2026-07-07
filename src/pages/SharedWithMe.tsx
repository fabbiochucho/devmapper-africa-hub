import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { listActiveGrantsForVerifier, type OrgShareScope } from '@/lib/org-data-shares';
import { SEOHead } from '@/components/seo/SEOHead';

interface Grant {
  id: string;
  grantor_org_id: string;
  scope: string[];
  purpose: string | null;
  expires_at: string;
  organizations: { name: string } | null;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function GrantSummary({ grant }: { grant: Grant }) {
  const [expanded, setExpanded] = useState(false);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCounts = async () => {
    if (counts || loading) {
      setExpanded((e) => !e);
      return;
    }
    setLoading(true);
    setExpanded(true);
    const result: Record<string, number> = {};
    for (const scope of grant.scope as OrgShareScope[]) {
      const { count } = await supabase
        .from(scope as any)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', grant.grantor_org_id);
      result[scope] = count ?? 0;
    }
    setCounts(result);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{grant.organizations?.name ?? 'Unknown organization'}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              Expires in {daysUntil(grant.expires_at)} day(s)
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadCounts}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {grant.scope.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
        {grant.purpose && <p className="text-sm text-muted-foreground">{grant.purpose}</p>}

        {expanded && (
          <div className="pt-2 border-t space-y-1">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {counts && Object.entries(counts).map(([scope, count]) => (
              <p key={scope} className="text-sm">
                <span className="text-muted-foreground">{scope}:</span> {count} record(s)
              </p>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Read-only summary for this audit engagement — not the full ESG dashboard.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SharedWithMe() {
  const { user } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listActiveGrantsForVerifier(user.id)
      .then((data) => setGrants(data as unknown as Grant[]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Shared With Me - DevMapper" description="Organizations that have granted you scoped, time-limited audit access to their ESG data." />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Shared With Me
        </h1>
        <p className="text-muted-foreground mt-1">Organizations that have granted you scoped audit access</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : grants.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No active data-sharing grants right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grants.map((grant) => (
            <GrantSummary key={grant.id} grant={grant} />
          ))}
        </div>
      )}
    </div>
  );
}
