import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SearchX, Loader2, ExternalLink } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { africanCountries } from '@/data/countries';
import { searchEntities, entityMeta, sourceName, type EntityHit } from '@/lib/entities';
import { SaveButton } from '@/components/workspace/SaveButton';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const q = (searchParams.get('q') || '').trim();
  const typeFilter = searchParams.get('type') || 'all';
  const country = searchParams.get('country') || 'all';
  const live = searchParams.get('live') === '1';
  const [draft, setDraft] = useState(q);

  const { data: results = [], isFetching, error } = useQuery({
    queryKey: ['entity-search', q, country, live, !!user],
    queryFn: () => searchEntities(q, { country: country === 'all' ? undefined : country, live, signedIn: !!user }),
    enabled: q.length >= 2,
    staleTime: 60_000,
  });

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of results) m.set(r.type, (m.get(r.type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [results]);
  const shown = typeFilter === 'all' ? results : results.filter((r) => r.type === typeFilter);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === 'all') params.delete(key); else params.set(key, value);
    setSearchParams(params);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set('q', draft.trim());
    params.delete('type');
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SEOHead title="Search development intelligence" description="Search projects, organisations, policies, programmes, research, funding and more across Africa." />
      <h1 className="text-2xl font-bold mb-1">Search</h1>
      <p className="text-muted-foreground mb-6">Projects, organisations, policies, programmes, research, funding, indicators and countries, each with its source.</p>

      <form onSubmit={submit} className="flex gap-2 mb-4">
        <Input id="search-q" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. food security Nigeria, solar mini-grids, climate disclosure" className="flex-1" />
        <Button type="submit"><Search className="h-4 w-4 mr-2" />Search</Button>
      </form>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={country} onValueChange={(v) => updateParam('country', v)}>
          <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {africanCountries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {user && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={live} onChange={(e) => updateParam('live', e.target.checked ? '1' : null)} />
            Also search live sources (IATI, OpenAlex, World Bank)
          </label>
        )}
      </div>

      {q.length >= 2 && counts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filter by type">
          <Button size="sm" variant={typeFilter === 'all' ? 'default' : 'outline'} onClick={() => updateParam('type', null)}>
            All ({results.length})
          </Button>
          {counts.map(([type, n]) => (
            <Button key={type} size="sm" variant={typeFilter === type ? 'default' : 'outline'} onClick={() => updateParam('type', type)}>
              {entityMeta(type).plural} ({n})
            </Button>
          ))}
        </div>
      )}

      {q.length < 2 ? (
        <p className="text-muted-foreground">Type at least two characters to search.</p>
      ) : isFetching ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Searching…</div>
      ) : error ? (
        <p className="text-destructive">Search failed. Try again in a moment.</p>
      ) : shown.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <SearchX className="h-10 w-10 mx-auto mb-3" />
          <p>No results for "{q}".{user && !live ? ' Try including live sources.' : ''}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => <ResultRow key={`${r.type}:${r.id}`} hit={r} canSave={!!user} />)}
        </ul>
      )}
    </div>
  );
};

function ResultRow({ hit, canSave }: { hit: EntityHit; canSave: boolean }) {
  const meta = entityMeta(hit.type);
  const Icon = meta.icon;
  return (
    <li className="border rounded-lg p-4 flex gap-3">
      <Icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={hit.path} className="font-medium hover:underline">{hit.title}</Link>
          <Badge variant="secondary">{meta.label}</Badge>
          {hit.countryCode && <Badge variant="outline">{hit.countryCode}</Badge>}
          {hit.match === 'semantic' && <Badge variant="outline">Related by meaning</Badge>}
        </div>
        {hit.snippet && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{hit.snippet}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Source: {sourceName(hit.source)}
          {hit.sourceUrl && (
            <>
              {' · '}
              <a href={hit.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center underline">
                View source <ExternalLink className="h-3 w-3 ml-0.5" aria-hidden />
              </a>
            </>
          )}
        </p>
      </div>
      {canSave && <SaveButton type={hit.type} id={hit.id} title={hit.title} />}
    </li>
  );
}

export default SearchPage;
