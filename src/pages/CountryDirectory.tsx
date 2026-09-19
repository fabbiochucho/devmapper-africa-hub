import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, TrendingUp, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { africanCountries, type Country } from "@/data/countries";
import CountryRatingWidget from "@/components/directory/CountryRatingWidget";

interface DirectoryEntry extends Country {
  totalReports: number;
  verifiedReports: number;
  totalBudget: number;
  avgRating: number | null;
  raterCount: number;
}

interface MostImprovedEntry {
  country_code: string;
  report_delta: number;
  verified_delta: number;
  latest_reports: number;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
};

const CountryDirectory = () => {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [mostImproved, setMostImproved] = useState<MostImprovedEntry[]>([]);
  const [view, setView] = useState<'all' | 'improved'>('all');
  const [loading, setLoading] = useState(true);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const loadData = async () => {
    // Every one of the 53 countries always renders, whether or not it has
    // reports yet - stats are matched on top of this static base list, not
    // the other way around.
    const base: DirectoryEntry[] = africanCountries.map(c => ({
      ...c, totalReports: 0, verifiedReports: 0, totalBudget: 0, avgRating: null, raterCount: 0,
    }));
    const byCode = new Map(base.map(c => [c.code, c]));

    // Existing reports.country_code values are inconsistently ISO-2/ISO-3
    // (confirmed live) - match against both code and code2 so existing
    // inconsistent rows still attribute correctly, without fixing the
    // underlying historical data.
    const findEntry = (rawCode: string) =>
      byCode.get(rawCode) || base.find(c => c.code2 === rawCode);

    const [statsRes, ratingsRes, improvedRes] = await Promise.all([
      supabase.rpc('get_country_directory_stats'),
      supabase.rpc('get_country_rating_aggregates'),
      supabase.rpc('get_most_improved_countries', { p_days: 30 }),
    ]);

    (statsRes.data || []).forEach((row) => {
      const entry = findEntry(row.country_code);
      if (!entry) return;
      entry.totalReports += row.total_reports;
      entry.verifiedReports += row.verified_reports;
      entry.totalBudget += Number(row.total_budget) || 0;
    });

    (ratingsRes.data || []).forEach((row) => {
      const entry = findEntry(row.country_code);
      if (!entry) return;
      entry.avgRating = row.avg_overall != null ? Number(row.avg_overall) : null;
      entry.raterCount = Number(row.rater_count) || 0;
    });

    setEntries(base.sort((a, b) => a.name.localeCompare(b.name)));
    setMostImproved(improvedRes.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="h-6 w-6" />Country Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">Every African country tracked, whether or not it has reports yet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setView('all')}>All Countries</Button>
          <Button variant={view === 'improved' ? 'default' : 'outline'} size="sm" onClick={() => setView('improved')}><TrendingUp className="h-4 w-4 mr-1" />Most Improved</Button>
        </div>
      </div>

      {view === 'improved' ? (
        mostImproved.length === 0 ? (
          <Card><CardContent className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Trend data builds up after a few weeks of tracking.</p>
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Most Improved (last 30 days)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mostImproved.map((row, i) => {
                const country = entries.find(e => e.code === row.country_code || e.code2 === row.country_code);
                return (
                  <div key={row.country_code} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-sm font-mono text-muted-foreground">#{i + 1}</span>
                      {country && <img src={`https://flagcdn.com/w20/${country.code2.toLowerCase()}.png`} width="20" alt={`${country.name} flag`} className="rounded-sm" />}
                      <span className="font-medium">{country?.name || row.country_code}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">+{row.report_delta} reports</div>
                      <div className="text-xs text-muted-foreground">+{row.verified_delta} verified</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((c) => (
            <Card key={c.code}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <img src={`https://flagcdn.com/w20/${c.code2.toLowerCase()}.png`} width="20" alt={`${c.name} flag`} className="rounded-sm" />
                  {c.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reports</span>
                  <span className="font-medium">{c.totalReports} {c.verifiedReports > 0 && <Badge variant="outline" className="ml-1 text-xs">{c.verifiedReports} verified</Badge>}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tracked budget</span>
                  <span className="font-medium">{formatCurrency(c.totalBudget)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Citizen rating</span>
                  <span className="font-medium">{c.avgRating != null ? `${c.avgRating.toFixed(1)} / 5` : 'Not yet rated'}{c.raterCount > 0 && <span className="text-xs text-muted-foreground ml-1">({c.raterCount})</span>}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setExpandedCode(expandedCode === c.code ? null : c.code)}>
                    {expandedCode === c.code ? 'Hide rating form' : 'Rate this country'}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/search?country=${c.code}`}>Reports <ChevronRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                </div>

                {expandedCode === c.code && (
                  <div className="pt-2 border-t">
                    <CountryRatingWidget countryCode={c.code} onRated={loadData} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryDirectory;
