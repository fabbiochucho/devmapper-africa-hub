
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, BookOpen, FileText, Video, Link, ExternalLink, Filter, Code, Zap, Shield, Key, Globe, Server, Clock, AlertTriangle, CheckCircle, Copy, Database, Users, BarChart3, FileCode, Terminal } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Webhook = ({ className }: { className?: string }) => <Zap className={className} />;

const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="text-sm bg-muted/80 border border-border p-4 rounded-lg overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
};

const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    PATCH: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    DELETE: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${colors[method] || 'bg-muted text-muted-foreground'}`}>
      {method}
    </span>
  );
};

const StatusCode = ({ code, description }: { code: number; description: string }) => {
  const color = code < 300 ? 'text-green-600' : code < 400 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 text-sm">
      <code className={`font-bold ${color}`}>{code}</code>
      <span className="text-muted-foreground">{description}</span>
    </div>
  );
};

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [apiSection, setApiSection] = useState('overview');

  const resources = [
    { title: 'SDG Implementation Handbook', description: 'Comprehensive guide to implementing Sustainable Development Goals in African communities', type: 'PDF', category: 'Guidelines', size: '4.2 MB', downloads: 2156, date: '2024-12-15', tags: ['SDG', 'Implementation', 'Community', 'Africa'] },
    { title: 'Community Engagement Toolkit', description: 'Practical tools and strategies for effective community participation in development projects', type: 'ZIP', category: 'Toolkits', size: '8.7 MB', downloads: 1843, date: '2024-12-10', tags: ['Engagement', 'Community', 'Participation', 'Tools'] },
    { title: 'Data Collection Best Practices', description: 'Video series on effective data collection methods for development projects', type: 'Video', category: 'Training', size: '45 min', downloads: 3421, date: '2024-12-08', tags: ['Data', 'Collection', 'Methods', 'Training'] },
    { title: 'Report Writing Templates', description: 'Standardized templates for various types of development project reports', type: 'DOCX', category: 'Templates', size: '2.1 MB', downloads: 1567, date: '2024-12-05', tags: ['Templates', 'Reports', 'Writing', 'Standards'] },
    { title: 'Verification Checklist', description: 'Comprehensive checklist for verifying the accuracy of project reports', type: 'PDF', category: 'Guidelines', size: '1.3 MB', downloads: 987, date: '2024-12-01', tags: ['Verification', 'Quality', 'Checklist', 'Accuracy'] },
    { title: 'Mobile Data Collection App Guide', description: 'Step-by-step guide to using mobile apps for field data collection', type: 'PDF', category: 'Guides', size: '2.8 MB', downloads: 1234, date: '2024-11-28', tags: ['Mobile', 'Apps', 'Field', 'Collection'] },
  ];

  const externalResources = [
    { title: 'UN SDG Knowledge Platform', description: 'Official UN platform for SDG resources and progress tracking', url: 'https://sustainabledevelopment.un.org/', organization: 'United Nations' },
    { title: 'Africa SDG Index', description: "Comprehensive assessment of African countries' progress on SDGs", url: 'https://sdgindex.org/', organization: 'SDSN Africa' },
    { title: 'World Bank Open Data', description: 'Free access to global development data and statistics', url: 'https://data.worldbank.org/', organization: 'World Bank' },
    { title: 'AfDB Development Indicators', description: 'African Development Bank statistics and development indicators', url: 'https://www.afdb.org/en/knowledge/statistics', organization: 'African Development Bank' },
  ];

  const categories = ['all', 'Guidelines', 'Toolkits', 'Training', 'Templates', 'Guides'];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'Video': return <Video className="w-4 h-4" />;
      case 'ZIP': case 'DOCX': return <Download className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const apiEndpoints = [
    {
      category: 'Projects',
      icon: <Database className="w-4 h-4" />,
      endpoints: [
        {
          method: 'GET', path: '/api/v1/projects',
          description: 'List all projects with pagination, filtering, and sorting',
          params: [
            { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
            { name: 'per_page', type: 'integer', required: false, description: 'Results per page (default: 25, max: 100)' },
            { name: 'country', type: 'string', required: false, description: 'ISO 3166-1 alpha-2 country code (e.g., KE, NG, ZA)' },
            { name: 'sdg', type: 'integer[]', required: false, description: 'Filter by SDG goals (comma-separated, e.g., 1,4,13)' },
            { name: 'status', type: 'string', required: false, description: 'Project status: active, completed, pending, verified' },
            { name: 'date_from', type: 'ISO 8601', required: false, description: 'Start date filter (e.g., 2024-01-01)' },
            { name: 'date_to', type: 'ISO 8601', required: false, description: 'End date filter' },
            { name: 'sort', type: 'string', required: false, description: 'Sort field: created_at, updated_at, title (prefix with - for desc)' },
            { name: 'search', type: 'string', required: false, description: 'Full-text search across title and description' },
            { name: 'verification_level', type: 'string', required: false, description: 'Filter by verification: self_report, citizen, ngo, government, platform_audit' },
          ],
          responseExample: `{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Solar Irrigation in Turkana",
      "description": "Installing solar-powered irrigation...",
      "country_code": "KE",
      "location": "Turkana County, Kenya",
      "latitude": 3.1166,
      "longitude": 35.5966,
      "sdg_goals": [2, 6, 7, 13],
      "status": "active",
      "verification_level": "ngo",
      "created_at": "2024-06-15T10:30:00Z",
      "updated_at": "2025-01-20T14:22:00Z",
      "author": {
        "id": "user-uuid",
        "name": "Jane Muthoni",
        "organization": "GreenAfrica Initiative"
      },
      "stats": {
        "beneficiaries": 1200,
        "budget_allocated": 45000,
        "budget_spent": 32500,
        "currency": "USD",
        "milestones_completed": 4,
        "milestones_total": 7
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 1547,
    "total_pages": 62
  }
}`,
          responses: [
            { code: 200, description: 'Success — Returns paginated project list' },
            { code: 400, description: 'Bad Request — Invalid query parameters' },
            { code: 401, description: 'Unauthorized — Missing or invalid API key' },
            { code: 429, description: 'Rate Limited — Too many requests' },
          ]
        },
        {
          method: 'GET', path: '/api/v1/projects/:id',
          description: 'Get detailed information about a specific project including milestones, budgets, indicators, and verification history',
          params: [
            { name: 'id', type: 'uuid', required: true, description: 'Project UUID' },
            { name: 'include', type: 'string[]', required: false, description: 'Related resources: milestones, budgets, indicators, verifications, updates, tasks' },
          ],
          responseExample: `{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Solar Irrigation in Turkana",
    "sdg_goals": [2, 6, 7, 13],
    "agenda2063_aspirations": [1, 5],
    "status": "active",
    "verification_level": "ngo",
    "milestones": [ { "id": "ms-uuid", "title": "Site Assessment Complete", "status": "completed", "completion_percentage": 100 } ],
    "budget": { "allocated": 45000, "spent": 32500, "currency": "USD", "transparency_score": 87 },
    "indicators": [ { "name": "Hectares Irrigated", "baseline_value": 0, "current_value": 45, "target_value": 100, "unit": "hectares" } ]
  }
}`,
          responses: [
            { code: 200, description: 'Success — Returns full project details' },
            { code: 404, description: 'Not Found — Project does not exist' },
          ]
        },
        {
          method: 'POST', path: '/api/v1/projects',
          description: 'Create a new project report. Requires authentication and available project quota.',
          params: [
            { name: 'title', type: 'string', required: true, description: 'Project title (3–200 characters)' },
            { name: 'description', type: 'string', required: true, description: 'Detailed project description (min 20 characters)' },
            { name: 'country_code', type: 'string', required: true, description: 'ISO 3166-1 alpha-2 country code' },
            { name: 'location', type: 'string', required: true, description: 'Human-readable location name' },
            { name: 'latitude', type: 'number', required: false, description: 'GPS latitude (-90 to 90)' },
            { name: 'longitude', type: 'number', required: false, description: 'GPS longitude (-180 to 180)' },
            { name: 'sdg_goals', type: 'integer[]', required: true, description: 'Array of SDG goal numbers (1–17)' },
            { name: 'start_date', type: 'ISO 8601', required: false, description: 'Project start date' },
            { name: 'end_date', type: 'ISO 8601', required: false, description: 'Estimated end date' },
            { name: 'budget', type: 'object', required: false, description: '{ allocated, currency, funding_source, donor_organization }' },
          ],
          responseExample: `{
  "data": { "id": "new-project-uuid", "title": "Clean Water Wells in Mombasa", "status": "pending" },
  "message": "Project created successfully. Quota remaining: 4"
}`,
          responses: [
            { code: 201, description: 'Created — Project successfully created' },
            { code: 400, description: 'Bad Request — Validation errors' },
            { code: 401, description: 'Unauthorized — Authentication required' },
            { code: 403, description: 'Forbidden — Quota exhausted or plan restriction' },
            { code: 422, description: 'Unprocessable — Invalid SDG goals or country code' },
          ]
        },
        {
          method: 'PATCH', path: '/api/v1/projects/:id',
          description: 'Update an existing project. Only the project owner or affiliated users can update.',
          params: [
            { name: 'title', type: 'string', required: false, description: 'Updated title' },
            { name: 'description', type: 'string', required: false, description: 'Updated description' },
            { name: 'status', type: 'string', required: false, description: 'active, completed, on_hold' },
            { name: 'sdg_goals', type: 'integer[]', required: false, description: 'Updated SDG goals' },
          ],
          responseExample: `{ "data": { "id": "project-uuid", "updated_at": "2025-03-08T14:00:00Z" }, "message": "Project updated" }`,
          responses: [
            { code: 200, description: 'Success — Project updated' },
            { code: 403, description: 'Forbidden — Not the project owner' },
            { code: 404, description: 'Not Found' },
          ]
        },
        {
          method: 'DELETE', path: '/api/v1/projects/:id',
          description: 'Soft-delete a project. Only the owner or an admin can delete. Data retained for 30 days.',
          params: [],
          responseExample: `{ "message": "Project archived. Will be permanently deleted after 30 days." }`,
          responses: [
            { code: 200, description: 'Success — Project archived' },
            { code: 403, description: 'Forbidden — Insufficient permissions' },
          ]
        },
      ]
    },
    {
      category: 'Updates & Milestones',
      icon: <BarChart3 className="w-4 h-4" />,
      endpoints: [
        {
          method: 'POST', path: '/api/v1/projects/:id/updates',
          description: 'Submit a progress update with optional photo evidence',
          params: [
            { name: 'update_text', type: 'string', required: true, description: 'Progress update narrative' },
            { name: 'progress_percent', type: 'integer', required: false, description: 'Overall completion percentage (0–100)' },
            { name: 'evidence_url', type: 'string', required: false, description: 'URL to supporting evidence' },
            { name: 'photos', type: 'string[]', required: false, description: 'Array of photo URLs' },
          ],
          responseExample: `{ "data": { "id": "update-uuid", "progress_percent": 65, "created_at": "2025-03-08T15:00:00Z" } }`,
          responses: [{ code: 201, description: 'Created' }, { code: 403, description: 'Forbidden — Not affiliated' }]
        },
        {
          method: 'GET', path: '/api/v1/projects/:id/milestones',
          description: 'List all milestones for a project with completion status',
          params: [{ name: 'status', type: 'string', required: false, description: 'pending, in_progress, completed' }],
          responseExample: `{ "data": [{ "id": "ms-uuid", "title": "Phase 1 - Community Assessment", "status": "completed", "completion_percentage": 100, "target_date": "2024-08-01" }] }`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'POST', path: '/api/v1/projects/:id/milestones',
          description: 'Create a new milestone',
          params: [
            { name: 'title', type: 'string', required: true, description: 'Milestone title' },
            { name: 'description', type: 'string', required: false, description: 'Details' },
            { name: 'target_date', type: 'ISO 8601', required: false, description: 'Target date' },
          ],
          responseExample: `{ "data": { "id": "new-ms-uuid", "title": "Phase 2", "status": "pending" } }`,
          responses: [{ code: 201, description: 'Created' }]
        },
      ]
    },
    {
      category: 'Verification',
      icon: <Shield className="w-4 h-4" />,
      endpoints: [
        {
          method: 'GET', path: '/api/v1/projects/:id/verifications',
          description: 'Get the full verification history (5-level system)',
          params: [],
          responseExample: `{
  "data": [{ "id": "ver-uuid", "verification_level": "citizen", "status": "approved", "verifier": { "name": "Community Leader" }, "verified_at": "2024-11-15T10:00:00Z" }],
  "verification_summary": { "current_level": "ngo", "levels_completed": ["self_report", "citizen", "ngo"], "trust_score": 78 }
}`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'POST', path: '/api/v1/projects/:id/verify',
          description: 'Submit a verification. Level is auto-determined by verifier role.',
          params: [
            { name: 'status', type: 'string', required: true, description: 'approved or rejected' },
            { name: 'comments', type: 'string', required: true, description: 'Verification notes' },
            { name: 'evidence_url', type: 'string', required: false, description: 'Supporting evidence' },
          ],
          responseExample: `{ "data": { "id": "ver-uuid", "verification_level": "ngo", "status": "approved" }, "message": "Verification submitted" }`,
          responses: [
            { code: 201, description: 'Created' },
            { code: 403, description: 'Forbidden — Role insufficient' },
            { code: 409, description: 'Conflict — Already verified at this level' },
          ]
        },
      ]
    },
    {
      category: 'Analytics & SDG Data',
      icon: <BarChart3 className="w-4 h-4" />,
      endpoints: [
        {
          method: 'GET', path: '/api/v1/analytics/dashboard',
          description: 'Platform-wide dashboard statistics',
          params: [
            { name: 'country', type: 'string', required: false, description: 'Filter by country code' },
            { name: 'sdg', type: 'integer', required: false, description: 'Filter by SDG goal' },
            { name: 'date_from', type: 'ISO 8601', required: false, description: 'Start date' },
            { name: 'date_to', type: 'ISO 8601', required: false, description: 'End date' },
          ],
          responseExample: `{
  "data": {
    "total_projects": 1547, "total_change_makers": 342, "active_campaigns": 89,
    "total_funds_raised": 2450000, "countries_covered": 38, "verified_projects": 876,
    "sdg_distribution": { "1": 145, "2": 203, "4": 312, "13": 234 },
    "top_countries": [{ "code": "KE", "name": "Kenya", "projects": 234 }],
    "monthly_trend": [{ "month": "2025-01", "new_projects": 67, "completed": 23 }]
  }
}`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'GET', path: '/api/v1/analytics/sdg-progress',
          description: 'SDG implementation progress for African countries (sourced from UN reports)',
          params: [
            { name: 'country', type: 'string', required: false, description: 'ISO country code' },
            { name: 'sdg', type: 'integer', required: false, description: 'Specific SDG (1–17)' },
            { name: 'year', type: 'integer', required: false, description: 'Reporting year' },
          ],
          responseExample: `{
  "data": {
    "sdg": 4, "title": "Quality Education", "africa_average_score": 52.3,
    "global_average_score": 68.1, "trend": "improving",
    "year_data": [{ "year": 2020, "score": 48.5 }, { "year": 2025, "score": 52.3 }],
    "country_scores": [{ "country": "MU", "name": "Mauritius", "score": 78.5 }]
  }
}`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'GET', path: '/api/v1/analytics/agenda2063',
          description: 'Agenda 2063 alignment data — how projects map to AU aspirations',
          params: [
            { name: 'aspiration', type: 'integer', required: false, description: 'Aspiration number (1–7)' },
            { name: 'sdg', type: 'integer', required: false, description: 'Cross-reference with SDG' },
          ],
          responseExample: `{
  "data": {
    "alignments": [{ "sdg_goal": 4, "sdg_target": "4.1", "agenda_aspiration": 1, "agenda_goal": "A high standard of living", "active_projects_count": 45 }],
    "coverage_summary": { "aspirations_covered": 7, "total_alignments": 156, "gaps": ["SDG 14 — no projects in Central Africa"] }
  }
}`,
          responses: [{ code: 200, description: 'Success' }]
        },
      ]
    },
    {
      category: 'Change Makers',
      icon: <Users className="w-4 h-4" />,
      endpoints: [
        {
          method: 'GET', path: '/api/v1/changemakers',
          description: 'List registered change makers with filtering',
          params: [
            { name: 'country', type: 'string', required: false, description: 'Country code' },
            { name: 'sdg', type: 'integer[]', required: false, description: 'SDG goals' },
            { name: 'verified', type: 'boolean', required: false, description: 'Only verified' },
            { name: 'search', type: 'string', required: false, description: 'Search name/description' },
          ],
          responseExample: `{
  "data": [{ "id": "cm-uuid", "title": "GreenAfrica Initiative", "location": "Nairobi, Kenya", "sdg_goals": [7, 13, 15], "is_verified": true, "projects_count": 12 }],
  "meta": { "page": 1, "total": 342 }
}`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'POST', path: '/api/v1/changemakers/nominate',
          description: 'Nominate a new change maker',
          params: [
            { name: 'title', type: 'string', required: true, description: 'Name/title' },
            { name: 'description', type: 'string', required: true, description: 'Description of work' },
            { name: 'location', type: 'string', required: true, description: 'Location' },
            { name: 'sdg_goals', type: 'integer[]', required: true, description: 'Relevant SDGs' },
            { name: 'impact_description', type: 'string', required: false, description: 'Impact summary' },
          ],
          responseExample: `{ "data": { "id": "nomination-uuid" }, "message": "Nomination submitted for review" }`,
          responses: [{ code: 201, description: 'Created' }]
        },
      ]
    },
    {
      category: 'ESG & Compliance',
      icon: <Shield className="w-4 h-4" />,
      endpoints: [
        {
          method: 'GET', path: '/api/v1/esg/indicators',
          description: 'ESG indicators for an organization (Pro+ plans)',
          params: [
            { name: 'organization_id', type: 'uuid', required: true, description: 'Organization UUID' },
            { name: 'reporting_year', type: 'integer', required: false, description: 'Year' },
          ],
          responseExample: `{
  "data": {
    "reporting_year": 2024,
    "environmental": { "carbon_scope1_tonnes": 1250, "carbon_scope2_tonnes": 890, "carbon_scope3_tonnes": 3400, "renewable_energy_percentage": 35 },
    "social": { "community_investment": 250000 },
    "esg_score": 72, "verification_status": "verified"
  }
}`,
          responses: [{ code: 200, description: 'Success' }, { code: 403, description: 'Forbidden — Requires Pro+' }]
        },
        {
          method: 'GET', path: '/api/v1/esg/regulatory-exposure',
          description: 'Regulatory exposure profile for compliance risk assessment',
          params: [
            { name: 'country_code', type: 'string', required: true, description: 'Country code' },
            { name: 'actor_type', type: 'string', required: true, description: 'ngo, corporate, government' },
            { name: 'sector_code', type: 'string', required: false, description: 'Industry sector' },
          ],
          responseExample: `{
  "data": {
    "risk_level": "medium", "compliance_score": 65,
    "mandatory_frameworks": [{ "name": "Nigeria SEC ESG Disclosure", "enforcement_risk": "high" }],
    "recommendations": ["Submit annual ESG disclosure to SEC by March deadline"]
  }
}`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'POST', path: '/api/v1/esg/suppliers/import',
          description: 'Bulk import suppliers via CSV for Scope 3 emissions tracking',
          params: [
            { name: 'file', type: 'multipart/form-data', required: true, description: 'CSV: name, sector, country_code, annual_spend, contact_email' },
            { name: 'organization_id', type: 'uuid', required: true, description: 'Organization UUID' },
          ],
          responseExample: `{ "data": { "imported": 45, "skipped": 3, "errors": [{ "row": 12, "message": "Invalid country code: XX" }] } }`,
          responses: [{ code: 200, description: 'Success' }, { code: 400, description: 'Bad Request — Invalid CSV' }]
        },
      ]
    },
    {
      category: 'Fundraising',
      icon: <Globe className="w-4 h-4" />,
      endpoints: [
        {
          method: 'GET', path: '/api/v1/campaigns',
          description: 'List active fundraising campaigns',
          params: [
            { name: 'category', type: 'string', required: false, description: 'Campaign category' },
            { name: 'sdg', type: 'integer[]', required: false, description: 'Filter by SDGs' },
            { name: 'status', type: 'string', required: false, description: 'active, completed, ended' },
          ],
          responseExample: `{ "data": [{ "id": "campaign-uuid", "title": "Solar Panels for Schools", "target_amount": 50000, "raised_amount": 32500, "currency": "USD", "sdg_goals": [4, 7] }] }`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'POST', path: '/api/v1/campaigns/:id/donate',
          description: 'Initiate a donation (via Flutterwave/Paystack)',
          params: [
            { name: 'amount', type: 'number', required: true, description: 'Donation amount' },
            { name: 'currency', type: 'string', required: true, description: 'Currency (USD, NGN, KES, ZAR, etc.)' },
            { name: 'anonymous', type: 'boolean', required: false, description: 'Anonymous donation' },
            { name: 'message', type: 'string', required: false, description: 'Donor message' },
          ],
          responseExample: `{ "data": { "payment_url": "https://checkout.flutterwave.com/...", "reference": "DM-DON-2025-xxxx" } }`,
          responses: [{ code: 200, description: 'Success — Returns payment URL' }, { code: 400, description: 'Bad Request' }]
        },
      ]
    },
    {
      category: 'AI Copilot',
      icon: <Zap className="w-4 h-4" />,
      endpoints: [
        {
          method: 'POST', path: '/api/v1/ai/chat',
          description: 'Send a message to the AI Copilot for compliance analysis, report drafting, or general questions',
          params: [
            { name: 'message', type: 'string', required: true, description: 'User message/prompt' },
            { name: 'context', type: 'string', required: false, description: 'compliance, report_drafting, general' },
            { name: 'project_id', type: 'uuid', required: false, description: 'Project context for grounded responses' },
            { name: 'conversation_id', type: 'uuid', required: false, description: 'Continue existing conversation' },
          ],
          responseExample: `{
  "data": {
    "response": "Based on your project in Kenya targeting SDG 6...",
    "conversation_id": "conv-uuid",
    "suggestions": ["Draft a progress report?", "Analyze compliance gaps for KE?"]
  }
}`,
          responses: [{ code: 200, description: 'Success' }, { code: 429, description: 'Rate Limited — AI quota exceeded' }]
        },
      ]
    },
    {
      category: 'Webhooks',
      icon: <Zap className="w-4 h-4" />,
      endpoints: [
        {
          method: 'POST', path: '/api/v1/webhooks',
          description: 'Register a webhook endpoint for real-time notifications',
          params: [
            { name: 'url', type: 'string', required: true, description: 'Your HTTPS callback URL' },
            { name: 'events', type: 'string[]', required: true, description: 'Events: project.created, project.verified, donation.received, milestone.completed, etc.' },
            { name: 'secret', type: 'string', required: false, description: 'Signing secret (auto-generated if omitted)' },
          ],
          responseExample: `{ "data": { "id": "wh-uuid", "url": "https://your-app.com/webhooks", "events": ["project.verified"], "secret": "whsec_xxx", "status": "active" } }`,
          responses: [{ code: 201, description: 'Created' }]
        },
        {
          method: 'GET', path: '/api/v1/webhooks',
          description: 'List your registered webhooks',
          params: [],
          responseExample: `{ "data": [{ "id": "wh-uuid", "url": "...", "events": [...], "status": "active" }] }`,
          responses: [{ code: 200, description: 'Success' }]
        },
        {
          method: 'DELETE', path: '/api/v1/webhooks/:id',
          description: 'Delete a webhook',
          params: [],
          responseExample: `{ "message": "Webhook deleted" }`,
          responses: [{ code: 200, description: 'Success' }]
        },
      ]
    },
  ];

  const rateLimits = [
    { plan: 'Free', requests: '100/hour', burst: '10/min', projects: '10/month', webhooks: '0', ai: '10/day' },
    { plan: 'Lite', requests: '500/hour', burst: '30/min', projects: '10/month', webhooks: '2', ai: '50/day' },
    { plan: 'Pro', requests: '2,000/hour', burst: '100/min', projects: '40/month', webhooks: '10', ai: '200/day' },
    { plan: 'Advanced', requests: '10,000/hour', burst: '500/min', projects: '150/month', webhooks: '50', ai: '1,000/day' },
    { plan: 'Enterprise', requests: 'Unlimited', burst: 'Custom', projects: 'Unlimited', webhooks: 'Unlimited', ai: 'Unlimited' },
  ];

  const sdkLanguages = [
    { lang: 'JavaScript / TypeScript', install: 'npm install @devmapper/sdk', example: `import { DevMapper } from '@devmapper/sdk';

const dm = new DevMapper({ apiKey: 'YOUR_API_KEY' });

// List projects in Kenya targeting SDG 4
const projects = await dm.projects.list({
  country: 'KE',
  sdg: [4],
  status: 'active'
});

console.log(\`Found \${projects.meta.total} projects\`);

// Create a project
const newProject = await dm.projects.create({
  title: 'Digital Literacy Program',
  description: 'Teaching coding skills to rural youth...',
  country_code: 'KE',
  location: 'Nakuru County',
  sdg_goals: [4, 8, 10],
  budget: { allocated: 25000, currency: 'USD' }
});

// Subscribe to webhooks
dm.webhooks.create({
  url: 'https://your-app.com/webhooks',
  events: ['project.verified', 'donation.received']
});` },
    { lang: 'Python', install: 'pip install devmapper', example: `from devmapper import DevMapperClient

dm = DevMapperClient(api_key="YOUR_API_KEY")

# List projects with pagination
projects = dm.projects.list(country="NG", sdg=[1, 2], page=1, per_page=50)

for project in projects.data:
    print(f"{project.title} - {project.status}")

# Get SDG analytics
analytics = dm.analytics.sdg_progress(country="KE", sdg=4)
print(f"SDG 4 score: {analytics.data.africa_average_score}")

# Submit a verification
dm.projects.verify(
    project_id="uuid",
    status="approved",
    comments="Site visit confirmed project activities"
)` },
    { lang: 'cURL', install: 'Built-in — no installation needed', example: `# List projects
curl -X GET "https://api.devmapper.africa/v1/projects?country=KE&sdg=4,13" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create a project
curl -X POST "https://api.devmapper.africa/v1/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Clean Water Wells",
    "description": "Installing bore holes in rural communities",
    "country_code": "KE",
    "location": "Turkana County",
    "sdg_goals": [6, 3]
  }'

# Submit verification
curl -X POST "https://api.devmapper.africa/v1/projects/ID/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{ "status": "approved", "comments": "Verified on site" }'` },
    { lang: 'Go', install: 'go get github.com/devmapper/devmapper-go', example: `package main

import (
    "fmt"
    dm "github.com/devmapper/devmapper-go"
)

func main() {
    client := dm.NewClient("YOUR_API_KEY")

    projects, err := client.Projects.List(&dm.ProjectListParams{
        Country: "ZA",
        SDG:     []int{7, 13},
        Status:  "active",
    })
    if err != nil { panic(err) }

    for _, p := range projects.Data {
        fmt.Printf("%s (%s)\\n", p.Title, p.Status)
    }

    stats, _ := client.Analytics.Dashboard(nil)
    fmt.Printf("Total projects: %d\\n", stats.Data.TotalProjects)
}` },
  ];

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
                { type: 'added', text: 'AI Copilot endpoint for compliance analysis and report drafting' },
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
        <p className="text-muted-foreground">Access tools, guides, and resources for sustainable development tracking</p>
      </div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library">Resource Library</TabsTrigger>
          <TabsTrigger value="external">External Links</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search resources..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select className="px-3 py-2 border rounded-md bg-background" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map(cat => (<option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>))}
              </select>
            </div>
          </div>
          <div className="grid gap-4">
            {filteredResources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">{getTypeIcon(resource.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{resource.title}</h3>
                          <Badge variant="outline">{resource.category}</Badge>
                          <Badge variant="secondary">{resource.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{resource.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.tags.map((tag, ti) => (<Badge key={ti} variant="outline" className="text-xs">{tag}</Badge>))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{resource.size}</span>
                          <span>{resource.downloads} downloads</span>
                          <span>Updated: {resource.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button><Download className="w-4 h-4 mr-2" />Download</Button>
                      <Button variant="outline">Preview</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">External Resources</h2>
          <div className="grid gap-4">
            {externalResources.map((resource, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg"><Link className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                        <p className="text-muted-foreground">{resource.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">Source: {resource.organization}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">Visit Site<ExternalLink className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-0">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Resources;
