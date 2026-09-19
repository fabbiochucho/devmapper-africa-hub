
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { sdgGoals } from '@/lib/constants';
import { getCountries, Country } from '@/data/countries';
import { Search, FolderKanban, User, Building } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

interface SearchProject {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface SearchOrganization {
  name: string;
  country: string | null;
  members_count: number;
}

type SearchResults = {
  projects: SearchProject[];
  users: UserProfile[];
  organizations: SearchOrganization[];
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  const typeFilter = searchParams.get('type') || 'all';
  const countryFilter = searchParams.get('country') || 'all';
  const sdgFilter = searchParams.get('sdg_goal') || 'all';

  useEffect(() => {
    async function fetchCountries() {
      const fetchedCountries = await getCountries();
      setCountries(fetchedCountries);
    }
    fetchCountries();
  }, []);

  const performSearch = useCallback(async (q: string, type: string, country: string, sdg: string) => {
    // `,` and `(`/`)` are structural characters in PostgREST's `.or()` filter
    // syntax - left unescaped, a search string containing them could inject
    // extra filter conditions rather than being treated as literal text.
    const safeTerm = q.replace(/[,()]/g, '');
    const term = `%${safeTerm}%`;

    const wantsProjects = type === 'all' || type === 'projects';
    const wantsProfiles = type === 'all' || type === 'users' || type === 'organizations';

    const [projectsResult, profilesResult] = await Promise.all([
      wantsProjects
        ? (() => {
            let projectsQuery = supabase
              .from('reports')
              .select('id, title, description, location, country_code, sdg_goal')
              .or(`title.ilike.${term},description.ilike.${term}`)
              .limit(30);
            if (country !== 'all') projectsQuery = projectsQuery.eq('country_code', country);
            if (sdg !== 'all') projectsQuery = projectsQuery.eq('sdg_goal', Number(sdg));
            return projectsQuery;
          })()
        : Promise.resolve({ data: [], error: null }),
      wantsProfiles
        ? (() => {
            let profilesQuery = supabase
              .from('public_profiles')
              .select('id, user_id, full_name, avatar_url, organization, country')
              .or(`full_name.ilike.${term},organization.ilike.${term}`)
              .limit(50);
            if (country !== 'all') profilesQuery = profilesQuery.eq('country', country);
            return profilesQuery;
          })()
        : Promise.resolve({ data: [], error: null }),
    ]);

    const lowerCaseQuery = q.toLowerCase();
    const projects: SearchProject[] = (projectsResult.data || []) as SearchProject[];
    const profiles = profilesResult.data || [];

    const users: UserProfile[] = (type === 'all' || type === 'users')
      ? profiles
          .filter(p => p.full_name?.toLowerCase().includes(lowerCaseQuery))
          .map(p => ({ id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }))
      : [];

    const organizations: SearchOrganization[] = [];
    if (type === 'all' || type === 'organizations') {
      const orgMap = new Map<string, SearchOrganization>();
      profiles
        .filter(p => p.organization?.toLowerCase().includes(lowerCaseQuery))
        .forEach(p => {
          const name = p.organization as string;
          const existing = orgMap.get(name);
          if (existing) {
            existing.members_count += 1;
          } else {
            orgMap.set(name, { name, country: p.country, members_count: 1 });
          }
        });
      organizations.push(...orgMap.values());
    }

    setResults({ projects, users, organizations });
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.length >= 2) {
      setLoading(true);
      performSearch(q, typeFilter, countryFilter, sdgFilter);
    } else {
      setResults(null);
    }
  }, [searchParams, performSearch, typeFilter, countryFilter, sdgFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(params => {
      params.set('q', query);
      return params;
    });
  };

  const updateParam = (key: string, value: string) => {
    setSearchParams(params => {
      params.set(key, value);
      return params;
    });
  }

  const totalResults = results ? results.projects.length + results.users.length + results.organizations.length : 0;

  return (
    <div className="space-y-6">
      <SEOHead
        title="Search — Dev Mapper"
        description="Search verified SDG projects, change-makers, and organisations across Africa on Dev Mapper."
        canonicalUrl="/search"
      />
      <h1 className="text-3xl font-bold">Search</h1>
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Search for projects, people, or organizations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit"><Search className="mr-2 h-4 w-4" /> Search</Button>
      </form>

      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={(v) => updateParam('type', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="projects">Projects</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="organizations">Organizations</SelectItem>
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={(v) => updateParam('country', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sdgFilter} onValueChange={(v) => updateParam('sdg_goal', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="SDG Goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SDG Goals</SelectItem>
            {sdgGoals.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : results ? (
          <div className="space-y-6">
            <p className="text-muted-foreground">{totalResults} results found for "{searchParams.get('q')}".</p>
            {results.projects.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Projects</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.projects.map(p => (
                    <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/reports?id=${p.id}`)}>
                      <CardHeader>
                        <CardTitle className="flex items-start gap-2"><FolderKanban className="w-5 h-5 text-primary mt-1" /><span>{p.title}</span></CardTitle>
                        <CardDescription>{p.location}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
            {results.users.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Users</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.users.map(u => (
                    <Card key={u.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />{u.full_name || 'Anonymous'}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}
            {results.organizations.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Organizations</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.organizations.map(o => (
                    <Card key={o.name}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary" />{o.name}</CardTitle>
                        <CardDescription>{o.country || 'Unknown location'} • {o.members_count} member{o.members_count === 1 ? '' : 's'}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>
            )}
            {totalResults === 0 && <p>No results found.</p>}
          </div>
        ) : (
          <p>Please enter a search query (at least 2 characters) to begin.</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
