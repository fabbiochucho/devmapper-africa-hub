import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, FileText, Code, Zap, Shield, Key, Globe, Server, Clock, AlertTriangle, FileCode, Terminal } from 'lucide-react';
import { CodeBlock, MethodBadge, StatusCode } from '@/components/resources/ApiDocPrimitives';
import { apiEndpoints, rateLimits } from '@/data/resourcesApiData';
import { sdkLanguages } from '@/data/resourcesSdkExamples';

const ApiDocsTab = () => {
  const [apiSection, setApiSection] = useState('overview');

  const renderApiNav = () => (
    <div className="space-y-1">
      {[
        { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'authentication', label: 'Authentication', icon: <Key className="w-4 h-4" /> },
        { id: 'endpoints', label: 'API Endpoints', icon: <Server className="w-4 h-4" /> },
        { id: 'sdks', label: 'SDKs & Libraries', icon: <FileCode className="w-4 h-4" /> },
        { id: 'webhooks', label: 'Webhooks Guide', icon: <Zap className="w-4 h-4" /> },
        { id: 'rate-limits', label: 'Rate Limits', icon: <Clock className="w-4 h-4" /> },
        { id: 'errors', label: 'Error Handling', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'changelog', label: 'Changelog', icon: <FileText className="w-4 h-4" /> },
      ].map(item => (
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
              <h2 className="text-2xl font-bold mb-2">DevMapper API v1</h2>
              <p className="text-muted-foreground leading-relaxed">
                The DevMapper REST API provides programmatic access to Africa's development intelligence data.
                Query projects across 54 countries, track SDG progress, verify impact, and integrate development data into your applications.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: <Globe className="w-5 h-5 text-primary" />, title: 'Base URL', content: <CodeBlock code="https://api.devmapper.africa/v1" /> },
                { icon: <Shield className="w-5 h-5 text-primary" />, title: 'Authentication', content: <CodeBlock code='Authorization: Bearer YOUR_API_KEY' /> },
                { icon: <Code className="w-5 h-5 text-primary" />, title: 'Response Format', content: <p className="text-sm text-muted-foreground">JSON with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">data</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">meta</code> wrappers</p> },
                { icon: <Clock className="w-5 h-5 text-primary" />, title: 'Rate Limits', content: <p className="text-sm text-muted-foreground">100–10,000 req/hr by plan. Enterprise: unlimited.</p> },
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
              <CardContent>
                <CodeBlock code={`# 1. Get your API key from Settings → API Access
# 2. Make your first request:

curl -X GET "https://api.devmapper.africa/v1/projects?country=KE&sdg=4&status=active" \\
  -H "Authorization: Bearer dm_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"

# Response: { "data": [...], "meta": { "page": 1, "total": 234 } }`} />
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

      case 'authentication':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Authentication</h2>
              <p className="text-muted-foreground">All API requests require authentication via Bearer token.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">API Key Types</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-500/15 text-green-700 border-green-500/30">Live</Badge>
                      <span className="font-medium text-sm">Production Key</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Prefix: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">dm_live_</code> — Full production access. Server-side only.</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">Test</Badge>
                      <span className="font-medium text-sm">Sandbox Key</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Prefix: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">dm_test_</code> — Returns mock data. Safe for development.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Making Authenticated Requests</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock code={`curl -X GET "https://api.devmapper.africa/v1/projects" \\
  -H "Authorization: Bearer dm_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`} />
                <CodeBlock language="javascript" code={`const response = await fetch('https://api.devmapper.africa/v1/projects', {
  headers: {
    'Authorization': 'Bearer dm_live_xxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`} />
              </CardContent>
            </Card>
            <Card className="border-destructive/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Security Best Practices</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Never expose API keys in client-side code or public repositories</li>
                      <li>• Rotate keys periodically via Settings → API Access</li>
                      <li>• Use test keys for development; live keys for production only</li>
                      <li>• Set IP allowlists for production keys (Enterprise plan)</li>
                      <li>• Use webhook signature verification for incoming events</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">OAuth 2.0 (Partner Integrations)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">For applications acting on behalf of users, we support OAuth 2.0 Authorization Code flow:</p>
                <CodeBlock code={`# 1. Redirect user to authorize
GET https://api.devmapper.africa/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://your-app.com/callback&
  scope=projects:read analytics:read&
  response_type=code

# 2. Exchange code for token
POST https://api.devmapper.africa/oauth/token
{ "grant_type": "authorization_code", "code": "AUTH_CODE",
  "client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_CLIENT_SECRET" }

# 3. Use the access token
Authorization: Bearer ACCESS_TOKEN`} />
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">Available Scopes</h4>
                  <div className="grid sm:grid-cols-2 gap-1.5 text-xs">
                    {['projects:read', 'projects:write', 'analytics:read', 'changemakers:read', 'campaigns:read', 'campaigns:donate', 'esg:read', 'esg:write', 'ai:chat', 'webhooks:manage'].map(scope => (
                      <code key={scope} className="bg-muted px-2 py-1 rounded">{scope}</code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'endpoints':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">API Endpoints</h2>
              <p className="text-muted-foreground">Complete reference for all REST API endpoints.</p>
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
                              <div className="border rounded-lg overflow-hidden">
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

      case 'sdks':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">SDKs & Libraries</h2>
              <p className="text-muted-foreground">Official client libraries for popular languages.</p>
            </div>
            {sdkLanguages.map((sdk, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    {sdk.lang}
                  </CardTitle>
                  <CardDescription><CodeBlock code={sdk.install} /></CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock language={sdk.lang.toLowerCase()} code={sdk.example} />
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'webhooks':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Webhooks Guide</h2>
              <p className="text-muted-foreground">Receive real-time notifications when events happen on DevMapper.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Available Events</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { event: 'project.created', desc: 'New project submitted' },
                    { event: 'project.updated', desc: 'Project modified' },
                    { event: 'project.verified', desc: 'Verification received' },
                    { event: 'project.completed', desc: 'Marked complete' },
                    { event: 'milestone.completed', desc: 'Milestone done' },
                    { event: 'donation.received', desc: 'Campaign donation' },
                    { event: 'changemaker.verified', desc: 'Change maker verified' },
                    { event: 'report.submitted', desc: 'Progress report filed' },
                    { event: 'esg.indicator_updated', desc: 'ESG data updated' },
                    { event: 'campaign.funded', desc: 'Campaign goal reached' },
                  ].map(e => (
                    <div key={e.event} className="flex items-start gap-2 p-2 border rounded text-sm">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{e.event}</code>
                      <span className="text-muted-foreground text-xs">{e.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Webhook Payload</CardTitle></CardHeader>
              <CardContent>
                <CodeBlock code={`// POST to your registered URL
// Headers:
//   X-DevMapper-Signature: sha256=xxxxxx
//   X-DevMapper-Event: project.verified
//   X-DevMapper-Delivery: delivery-uuid

{
  "id": "evt_xxxxxxxxxxxx",
  "type": "project.verified",
  "created_at": "2025-03-08T10:30:00Z",
  "data": {
    "project_id": "project-uuid",
    "title": "Solar Irrigation in Turkana",
    "verification_level": "ngo",
    "verifier": "WaterAid Kenya"
  }
}`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Signature Verification</CardTitle></CardHeader>
              <CardContent>
                <CodeBlock language="javascript" code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/devmapper', (req, res) => {
  const sig = req.headers['x-devmapper-signature'];
  if (!verifyWebhook(JSON.stringify(req.body), sig, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  switch (req.headers['x-devmapper-event']) {
    case 'project.verified':
      handleProjectVerified(req.body.data);
      break;
    case 'donation.received':
      handleDonation(req.body.data);
      break;
  }
  res.status(200).send('OK');
});`} />
              </CardContent>
            </Card>
            <Card className="border-amber-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Retry Policy</h4>
                    <p className="text-sm text-muted-foreground">Failed deliveries retried with exponential backoff: 1min, 5min, 30min, 2hr, 12hr. After 5 failures the webhook is paused.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'rate-limits':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Rate Limits & Quotas</h2>
              <p className="text-muted-foreground">Usage limits vary by plan.</p>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-4 py-3 text-left font-semibold">Plan</th>
                        <th className="px-4 py-3 text-left font-semibold">Requests/hr</th>
                        <th className="px-4 py-3 text-left font-semibold">Burst</th>
                        <th className="px-4 py-3 text-left font-semibold">Projects/mo</th>
                        <th className="px-4 py-3 text-left font-semibold">Webhooks</th>
                        <th className="px-4 py-3 text-left font-semibold">AI/day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateLimits.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{r.plan}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.requests}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.burst}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.projects}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.webhooks}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.ai}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Rate Limit Headers</CardTitle></CardHeader>
              <CardContent>
                <CodeBlock code={`# Included on every response:
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1847
X-RateLimit-Reset: 1709901600

# When rate limited (HTTP 429):
Retry-After: 45`} />
              </CardContent>
            </Card>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Error Handling</h2>
              <p className="text-muted-foreground">Consistent JSON error responses with actionable messages.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Error Response Format</CardTitle></CardHeader>
              <CardContent>
                <CodeBlock code={`{
  "error": {
    "code": "validation_error",
    "message": "Invalid request parameters",
    "details": [{ "field": "sdg_goals", "message": "Must be integers 1–17" }],
    "request_id": "req_xxxxxxxxxxxx",
    "documentation_url": "https://docs.devmapper.africa/errors/validation_error"
  }
}`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Error Codes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { code: 400, name: 'bad_request', desc: 'Malformed request body or query parameters' },
                    { code: 401, name: 'unauthorized', desc: 'Missing, invalid, or expired API key' },
                    { code: 403, name: 'forbidden', desc: 'Valid key but insufficient permissions or plan restrictions' },
                    { code: 404, name: 'not_found', desc: 'Resource does not exist' },
                    { code: 409, name: 'conflict', desc: 'Duplicate or conflicting state' },
                    { code: 422, name: 'validation_error', desc: 'Semantic errors in request' },
                    { code: 429, name: 'rate_limited', desc: 'Too many requests — check Retry-After header' },
                    { code: 500, name: 'internal_error', desc: 'Server error — retry with backoff' },
                    { code: 503, name: 'service_unavailable', desc: 'Maintenance — check status.devmapper.africa' },
                  ].map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <code className={`font-bold text-sm ${e.code >= 500 ? 'text-red-700' : e.code >= 400 ? 'text-red-600' : 'text-amber-600'}`}>{e.code}</code>
                      <div>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{e.name}</code>
                        <p className="text-sm text-muted-foreground mt-0.5">{e.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Retry Strategy</CardTitle></CardHeader>
              <CardContent>
                <CodeBlock language="javascript" code={`async function apiRequest(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response.json();

    if (response.status === 429) {
      const wait = parseInt(response.headers.get('Retry-After') || '60');
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (response.status >= 500 && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      continue;
    }
    const error = await response.json();
    throw new Error(error.error.message);
  }
}`} />
              </CardContent>
            </Card>
          </div>
        );

      case 'changelog':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">API Changelog</h2>
              <p className="text-muted-foreground">Track changes, new endpoints, and deprecations.</p>
            </div>
            {[
              { date: '2025-03-08', version: 'v1.6.0', changes: [
                { type: 'added', text: 'Ndovu Akili AI endpoint for compliance analysis and report drafting' },
                { type: 'added', text: 'Regulatory exposure profile endpoint' },
                { type: 'added', text: 'Bulk supplier CSV import for Scope 3 emissions' },
                { type: 'improved', text: 'Project details include verification_summary with trust_score' },
              ]},
              { date: '2025-02-15', version: 'v1.5.0', changes: [
                { type: 'added', text: 'Webhook system with 10 event types and signature verification' },
                { type: 'added', text: 'OAuth 2.0 authorization code flow' },
                { type: 'added', text: 'Go SDK release' },
              ]},
              { date: '2025-01-20', version: 'v1.4.0', changes: [
                { type: 'added', text: 'Project milestones and progress updates endpoints' },
                { type: 'added', text: '5-level verification system' },
                { type: 'added', text: 'Agenda 2063 alignment analytics' },
              ]},
              { date: '2024-12-01', version: 'v1.3.0', changes: [
                { type: 'added', text: 'ESG indicators and fundraising endpoints' },
                { type: 'deprecated', text: '/api/v1/stats merged into /api/v1/analytics/dashboard' },
              ]},
              { date: '2024-10-15', version: 'v1.2.0', changes: [
                { type: 'added', text: 'Full-text search and Python SDK' },
              ]},
              { date: '2024-08-01', version: 'v1.0.0', changes: [
                { type: 'added', text: 'Initial API release with projects CRUD, analytics, and JavaScript SDK' },
              ]},
            ].map((release, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge>{release.version}</Badge>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {release.changes.map((change, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 ${
                          change.type === 'added' ? 'border-green-500/50 text-green-700' :
                          change.type === 'improved' ? 'border-blue-500/50 text-blue-700' :
                          'border-amber-500/50 text-amber-700'
                        }`}>{change.type}</Badge>
                        <span className="text-muted-foreground">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
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
            <option value="overview">Overview</option>
            <option value="authentication">Authentication</option>
            <option value="endpoints">API Endpoints</option>
            <option value="sdks">SDKs & Libraries</option>
            <option value="webhooks">Webhooks Guide</option>
            <option value="rate-limits">Rate Limits</option>
            <option value="errors">Error Handling</option>
            <option value="changelog">Changelog</option>
          </select>
        </div>
        {renderApiContent()}
      </div>
    </div>
  );
};

export default ApiDocsTab;
