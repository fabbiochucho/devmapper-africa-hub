
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockReports, Report } from '@/data/mockReports';
import { mockUsers, MockUser } from '@/data/mockUsers';
import { mockOrganizations, Organization } from '@/data/mockOrganizations';
import { sdgGoals } from '@/lib/constants';
import { getCountries, Country } from '@/data/countries';
import { Search, FolderKanban, User, Building } from 'lucide-react';

type SearchResults = {
  projects: Report[];
  users: MockUser[];
  organizations: Organization[];
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
    const q = searchParams.get('q');
    if (q && q.length >= 2) {
      setLoading(true);
      performSearch(q, typeFilter, countryFilter, sdgFilter);
    } else {
      setResults(null);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchCountries() {
      const fetchedCountries = await getCountries();
      setCountries(fetchedCountries);
    }
    fetchCountries();
  }, []);

  const performSearch = (q: string, type: string, country: string, sdg: string) => {
    const lowerCaseQuery = q.toLowerCase();
    
    const filteredProjects = mockReports.filter(p => {
      const matchesQuery = p.title.toLowerCase().includes(lowerCaseQuery) || p.description?.toLowerCase().includes(lowerCaseQuery);
      const matchesCountry = country === 'all' || p.country_code === country;
      const matchesSdg = sdg === 'all' || p.sdg_goal === sdg;
      return matchesQuery && matchesCountry && matchesSdg;
    });

    const filteredUsers = mockUsers.filter(u => {
      const matchesQuery = u.name.toLowerCase().includes(lowerCaseQuery) || u.organization?.toLowerCase().includes(lowerCaseQuery);
      const matchesCountry = country === 'all' || u.country === country;
      return matchesQuery && matchesCountry;
    });

    const filteredOrganizations = mockOrganizations.filter(o => {
      const matchesQuery = o.name.toLowerCase().includes(lowerCaseQuery);
      const matchesCountry = country === 'all' || o.country === country;
      return matchesQuery && matchesCountry;
    });
    
    setResults({
      projects: type === 'all' || type === 'projects' ? filteredProjects : [],
      users: type === 'all' || type === 'users' ? filteredUsers : [],
      organizations: type === 'all' || type === 'organizations' ? filteredOrganizations : [],
    });

    setLoading(false);
  };

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
                        <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />{u.name}</CardTitle>
                        <CardDescription>{u.role}{u.organization && ` at ${u.organization}`}</CardDescription>
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
                    <Card key={o.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary" />{o.name}</CardTitle>
                        <CardDescription>{o.type} in {o.country} • {o.projects_count} projects</CardDescription>
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
