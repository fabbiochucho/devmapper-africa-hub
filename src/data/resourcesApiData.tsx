import { Database, BarChart3, Shield, Globe, Users, Zap } from 'lucide-react';

export const apiEndpoints = [
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
    category: 'Ndovu Akili AI',
    icon: <Zap className="w-4 h-4" />,
    endpoints: [
      {
        method: 'POST', path: '/api/v1/ai/chat',
        description: 'Send a message to the Ndovu Akili AI for compliance analysis, report drafting, or general questions',
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

export const rateLimits = [
  { plan: 'Free', requests: '100/hour', burst: '10/min', projects: '10/month', webhooks: '0', ai: '10/day' },
  { plan: 'Lite', requests: '500/hour', burst: '30/min', projects: '10/month', webhooks: '2', ai: '50/day' },
  { plan: 'Pro', requests: '2,000/hour', burst: '100/min', projects: '40/month', webhooks: '10', ai: '200/day' },
  { plan: 'Advanced', requests: '10,000/hour', burst: '500/min', projects: '150/month', webhooks: '50', ai: '1,000/day' },
  { plan: 'Enterprise', requests: 'Unlimited', burst: 'Custom', projects: 'Unlimited', webhooks: 'Unlimited', ai: 'Unlimited' },
];
