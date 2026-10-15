import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, FileText, Code, Shield, Key, Globe, Server, Clock, AlertTriangle, Terminal } from 'lucide-react';
import { CodeBlock, MethodBadge, StatusCode } from '@/components/resources/ApiDocPrimitives';
import { API_BASE_URL, apiEndpoints, codeExamples } from '@/data/resourcesApiData';

// Documents the real public-api edge function - see src/data/resourcesApiData.tsx.
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'access', label: 'Access & Data', icon: <Key className="w-4 h-4" /> },
  { id: 'endpoints', label: 'API Endpoints', icon: <Server className="w-4 h-4" /> },
  { id: 'examples', label: 'Code Examples', icon: <Terminal className="w-4 h-4" /> },
  { id: 'limits', label: 'Caching & Limits', icon: <Clock className="w-4 h-4" /> },
  { id: 'errors', label: 'Error Handling', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'changelog', label: 'Changelog', icon: <FileText className="w-4 h-4" /> },
];

const ApiDocsTab = () => {
  const [apiSection, setApiSection] = useState('overview');

  const renderApiNav = () => (
    <div className="space-y-1">
      {SECTIONS.map(item => (
        <button
          key={item.id}
          onClick={() => setApiSection(item.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
            apiSection === item.id
              ? 'bg-primary text-primary-foreground font-medium'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );

  const renderApiContent = () => {
    switch (apiSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">DevMapper Public API v1</h2>
              <p className="text-muted-foreground leading-relaxed">
                Read-only access to DevMapper's public data: development projects across Africa, their milestones,
                change makers, fundraising campaigns, country regulatory profiles, SDG and Agenda 2063 alignments,
                and carbon-credit retirement certificates. No API key is needed.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <Globe className="w-5 h-5 text-primary" />, title: 'Base URL', content: <CodeBlock code={API_BASE_URL} /> },
                { icon: <Shield className="w-5 h-5 text-primary" />, title: 'Authentication', content: <p className="text-sm text-muted-foreground">None. Every endpoint is a public <code className="bg-muted px-1.5 py-0.5 rounded text-xs">GET</code>.</p> },
                { icon: <Code className="w-5 h-5 text-primary" />, title: 'Response Format', content: <p className="text-sm text-muted-foreground">JSON. Results are in <code className="bg-muted px-1.5 py-0.5 rounded text-xs">data</code>; paged lists add <code className="bg-muted px-1.5 py-0.5 rounded text-xs">meta</code> (page, per_page, total).</p> },
                { icon: <Clock className="w-5 h-5 text-primary" />, title: 'Freshness', content: <p className="text-sm text-muted-foreground">Responses may be cached for up to 5 minutes.</p> },
              ].map((card, i) => (
                <Card key={i} className="border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg">{card.icon}</div>
                      <h3 className="font-semibold">{card.title}</h3>
                    </div>
                    {card.content}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Quick Start</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <CodeBlock code={`curl "${API_BASE_URL}/v1/projects?country=KE&sdg=4"

# { "data": [ ... ], "meta": { "page": 1, "per_page": 25, "total": 3 } }`} />
                <p className="text-sm text-muted-foreground">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">GET {API_BASE_URL}</code> lists every endpoint.
                </p>
              </CardContent>
            </Card>
            <div>
              <h3 className="font-semibold mb-3">Available Resources</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {apiEndpoints.map((cat, i) => (
                  <Card key={i} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setApiSection('endpoints')}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">{cat.icon}</div>
                      <div>
                        <p className="font-medium text-sm">{cat.category}</p>
                        <p className="text-xs text-muted-foreground">{cat.endpoints.length} endpoint{cat.endpoints.length > 1 ? 's' : ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 'access':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Access & Data</h2>
              <p className="text-muted-foreground">What the API returns, and what it never does.</p>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
                <p><b className="text-foreground">No key, read-only.</b> Every endpoint is a public GET. Other methods return <code className="bg-muted px-1.5 py-0.5 rounded text-xs">405</code>.</p>
                <p><b className="text-foreground">Public data only.</b> Queries run with the same permissions as a signed-out visitor, so the API returns exactly what anyone can already see on devmapper.africa: public projects, never private or draft reports.</p>
                <p><b className="text-foreground">No personal data.</b> User ids, emails and phone numbers are never included.</p>
                <p><b className="text-foreground">Writing data</b> (submitting reports, milestones, verifications) happens in the DevMapper app, where contributors are signed in and submissions go through verification.</p>
                <p><b className="text-foreground">Licence and attribution.</b> Please credit "DevMapper (devmapper.africa)" when you publish the data. Country profiles and projects come from contributors and public sources; check important figures against the original sources.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'endpoints':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">API Endpoints</h2>
              <p className="text-muted-foreground">Every endpoint the API serves. Paths are relative to the base URL.</p>
            </div>
            <Accordion type="multiple" className="space-y-3">
              {apiEndpoints.map((category, catIdx) => (
                <AccordionItem key={catIdx} value={`cat-${catIdx}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-primary/10 rounded">{category.icon}</div>
                      <span className="font-semibold">{category.category}</span>
                      <Badge variant="outline" className="text-xs">{category.endpoints.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    {category.endpoints.map((ep, epIdx) => (
                      <Card key={epIdx} className="border-border/50">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <MethodBadge method={ep.method} />
                            <code className="text-sm font-medium bg-muted px-2.5 py-1 rounded">{ep.path}</code>
                          </div>
                          <p className="text-sm text-muted-foreground">{ep.description}</p>
                          {ep.params.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Parameters</h4>
                              <div className="border rounded-lg overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="px-3 py-2 text-left font-medium">Name</th>
                                      <th className="px-3 py-2 text-left font-medium">Type</th>
                                      <th className="px-3 py-2 text-left font-medium">Required</th>
                                      <th className="px-3 py-2 text-left font-medium">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ep.params.map((p, pIdx) => (
                                      <tr key={pIdx} className="border-t border-border/50">
                                        <td className="px-3 py-2"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.name}</code></td>
                                        <td className="px-3 py-2 text-muted-foreground text-xs">{p.type}</td>
                                        <td className="px-3 py-2">{p.required ? <Badge className="text-[10px] px-1.5 py-0 bg-red-500/15 text-red-700 border-red-500/30">Required</Badge> : <span className="text-xs text-muted-foreground">Optional</span>}</td>
                                        <td className="px-3 py-2 text-muted-foreground text-xs">{p.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Response Example</h4>
                            <CodeBlock language="json" code={ep.responseExample} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Status Codes</h4>
                            <div className="space-y-1">
                              {ep.responses.map((r, rIdx) => (
                                <StatusCode key={rIdx} code={r.code} description={r.description} />
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Code Examples</h2>
              <p className="text-muted-foreground">It's plain HTTPS and JSON, so no SDK is needed.</p>
            </div>
            {codeExamples.map((ex) => (
              <Card key={ex.language}>
                <CardHeader><CardTitle className="text-base">{ex.language}</CardTitle></CardHeader>
                <CardContent><CodeBlock language={ex.language} code={ex.code} /></CardContent>
              </Card>
            ))}
          </div>
        );

      case 'limits':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Caching & Limits</h2>
            </div>
            <Card>
              <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
                <p><b className="text-foreground">Page size:</b> up to 100 results per request (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">per_page</code>), default 25.</p>
                <p><b className="text-foreground">Caching:</b> successful responses carry <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Cache-Control: public, max-age=300</code>; new data can take up to 5 minutes to appear.</p>
                <p><b className="text-foreground">Fair use:</b> there are no per-key quotas, but the service runs on shared infrastructure. Cache results on your side and avoid more than a few requests per second. For bulk or high-volume use, contact us.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Error Handling</h2>
              <p className="text-muted-foreground">Errors return a JSON body with a single <code className="bg-muted px-1.5 py-0.5 rounded text-xs">error</code> message.</p>
            </div>
            <CodeBlock language="json" code={`{ "error": "sdg must be comma-separated integers from 1 to 17" }`} />
            <div className="space-y-1">
              <StatusCode code={400} description="Bad request - an invalid parameter; the message says which" />
              <StatusCode code={404} description="Unknown endpoint or version, or the item doesn't exist or isn't public" />
              <StatusCode code={405} description="Method not allowed - the API is read-only (GET only)" />
              <StatusCode code={500} description="Server error - retry later; tell us if it persists" />
            </div>
          </div>
        );

      case 'changelog':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Changelog</h2>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge>v1.0</Badge>
                  <CardTitle className="text-base">16 October 2026</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  First public release: projects, milestones, change makers, campaigns, countries, SDG indicators,
                  Agenda 2063 links, certificate verification and statistics. Read-only, no key required.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex gap-6">
      <aside className="hidden lg:block w-56 shrink-0 sticky top-6 self-start">
        <div className="border rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Navigation</p>
          {renderApiNav()}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="lg:hidden mb-4">
          <select value={apiSection} onChange={(e) => setApiSection(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {renderApiContent()}
      </div>
    </div>
  );
};

export default ApiDocsTab;
