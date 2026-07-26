import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface IatiActivity {
  iatiIdentifier: string;
  title: string | null;
  reportingOrg: string | null;
  sector: string | null;
  totalBudget: number | null;
}

/**
 * #96: IATI aid-flow data for a country, via the iati-proxy edge function.
 * Unlike #95 (World Bank, confirmed public/keyless), IATI's Datastore API
 * requires a registered subscription key this session doesn't have -
 * confirmed via a direct 401 probe. Shows real data once IATI_API_KEY is
 * configured; otherwise shows exactly what's needed to activate it, rather
 * than a fabricated placeholder.
 */
export function AidFlowDataCard({ countryCode }: { countryCode: string | null }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [activities, setActivities] = useState<IatiActivity[]>([]);

  useEffect(() => {
    if (!countryCode) { setLoading(false); return; }
    supabase.functions.invoke('iati-proxy', { body: { countryCode } })
      .then(({ data, error }) => {
        if (error) { setMessage('Aid-flow data temporarily unavailable.'); return; }
        setConfigured(data?.configured ?? false);
        setMessage(data?.message ?? null);
        setRateLimited(data?.rateLimited ?? false);
        setActivities(data?.activities ?? []);
      })
      .finally(() => setLoading(false));
  }, [countryCode]);

  if (!countryCode) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Handshake className="h-4 w-4" />Aid Flow Data (IATI)
        </CardTitle>
        <CardDescription>Development aid activities reported to the International Aid Transparency Initiative for {countryCode}.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : configured === false || rateLimited ? (
          <div className="flex gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
            <p>{message}</p>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No IATI-reported activities found for this country.</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map((a) => (
              <div key={a.iatiIdentifier} className="flex items-center justify-between border rounded-lg p-2.5 text-sm">
                <div>
                  <p className="font-medium">{a.title || 'Untitled activity'}</p>
                  <p className="text-xs text-muted-foreground">{a.reportingOrg || 'Unknown reporting org'}</p>
                </div>
                {a.sector && <Badge variant="outline" className="text-xs">{a.sector}</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
