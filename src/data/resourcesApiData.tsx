import { Database, BarChart3, Globe, Users, Award } from 'lucide-react';

// Reference for the real DevMapper Public API v1 (supabase/functions/public-api).
// Keep this in step with that function: every path, parameter and field here exists there.

export const API_BASE_URL = 'https://ptfrzwsivtetvmdotfui.supabase.co/functions/v1/public-api';

const pageParams = [
  { name: 'page', type: 'integer', required: false, description: 'Page number (default 1)' },
  { name: 'per_page', type: 'integer', required: false, description: 'Results per page (default 25, max 100)' },
];
const sdgParam = { name: 'sdg', type: 'integer list', required: false, description: 'SDG goals, comma-separated (1-17), e.g. 6,7' };
const listResponses = [
  { code: 200, description: 'Success - returns data and paging meta' },
  { code: 400, description: 'Bad request - an invalid parameter (the message says which)' },
];
const itemResponses = [
  { code: 200, description: 'Success' },
  { code: 404, description: 'Not found, or not public' },
];

export const apiEndpoints = [
  {
    category: 'Projects',
    icon: <Database className="w-4 h-4" />,
    endpoints: [
      {
        method: 'GET', path: '/v1/projects',
        description: 'List public projects (reports), newest first.',
        params: [
          ...pageParams,
          { name: 'country', type: 'string', required: false, description: 'ISO 3166-1 alpha-2 or alpha-3 code, e.g. NG or KEN' },
          sdgParam,
          { name: 'status', type: 'string', required: false, description: 'Project status, e.g. planned, ongoing, completed' },
          { name: 'verified', type: 'boolean', required: false, description: 'true to return verified projects only' },
          { name: 'search', type: 'string', required: false, description: 'Matches title or description' },
          { name: 'sort', type: 'string', required: false, description: 'submitted_at (default, newest first), updated_at, or title' },
        ],
        responseExample: `{
  "data": [
    {
      "id": "53e0e11d-37b1-4e69-852f-c9b273ab179a",
      "title": "Borehole rehabilitation",
      "description": "...",
      "sdg_goal": 6,
      "sdg_target": "6.1",
      "project_status": "ongoing",
      "location": "Kano, Nigeria",
      "country_code": "NG",
      "lat": 12.0,
      "lng": 8.52,
      "cost": 25000,
      "cost_currency": "USD",
      "beneficiaries": 1200,
      "funder": "...",
      "sponsor": null,
      "contractor": null,
      "start_date": "2026-01-10",
      "end_date": "2026-12-20",
      "is_verified": false,
      "verification_count": 1,
      "submitted_at": "2026-09-30T08:12:00Z",
      "updated_at": "2026-10-02T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 25, "total": 6 }
}`,
        responses: listResponses,
      },
      {
        method: 'GET', path: '/v1/projects/{id}',
        description: 'One public project, with the same fields as the list.',
        params: [{ name: 'id', type: 'uuid', required: true, description: 'Project id' }],
        responseExample: `{ "data": { "id": "53e0e11d-...", "title": "Borehole rehabilitation", "sdg_goal": 6, "...": "..." } }`,
        responses: itemResponses,
      },
      {
        method: 'GET', path: '/v1/projects/{id}/milestones',
        description: "A public project's milestones, by target date.",
        params: [{ name: 'id', type: 'uuid', required: true, description: 'Project id' }],
        responseExample: `{
  "data": [
    { "id": "...", "title": "Drilling complete", "description": null, "status": "pending",
      "completion_percentage": 0, "target_date": "2026-11-30", "sdg_indicators": [6], "updated_at": "..." }
  ]
}`,
        responses: [{ code: 200, description: 'Success (an empty list if none, or the project is not public)' }],
      },
    ],
  },
  {
    category: 'Change Makers & Campaigns',
    icon: <Users className="w-4 h-4" />,
    endpoints: [
      {
        method: 'GET', path: '/v1/change-makers',
        description: 'Change-maker profiles, newest first.',
        params: [...pageParams, { name: 'country', type: 'string', required: false, description: 'ISO country code' }, sdgParam],
        responseExample: `{
  "data": [
    { "id": "...", "title": "...", "description": "...", "impact_description": "...", "location": "...",
      "country_code": "KE", "sdg_goals": [4, 5], "projects_count": 3, "total_funding": 12000,
      "image_url": "...", "is_verified": true, "created_at": "..." }
  ],
  "meta": { "page": 1, "per_page": 25, "total": 0 }
}`,
        responses: listResponses,
      },
      {
        method: 'GET', path: '/v1/campaigns',
        description: 'Fundraising campaigns, newest first.',
        params: [...pageParams, { name: 'status', type: 'string', required: false, description: 'e.g. active, completed' }, sdgParam],
        responseExample: `{
  "data": [
    { "id": "...", "title": "...", "category": "...", "location": "...", "sdg_goals": [7],
      "currency": "NGN", "target_amount": 500000, "raised_amount": 120000, "deadline": "2026-12-31",
      "status": "active", "image_url": null, "is_verified": false, "report_id": null, "created_at": "..." }
  ],
  "meta": { "page": 1, "per_page": 25, "total": 1 }
}`,
        responses: listResponses,
      },
    ],
  },
  {
    category: 'Countries & Standards',
    icon: <Globe className="w-4 h-4" />,
    endpoints: [
      {
        method: 'GET', path: '/v1/countries',
        description: 'Regulatory and institutional profile of all 54 African countries.',
        params: [],
        responseExample: `{
  "data": [
    { "country_code": "NGA", "iso2_code": "NG", "country_name": "Nigeria", "currency_code": "NGN",
      "official_languages": ["English"], "regional_blocs": ["ECOWAS", "AU"], "legal_system_type": "...",
      "esg_regulatory_status": "...", "climate_disclosure_status": "...", "carbon_market_maturity": "...",
      "digital_reporting_maturity": "...", "environmental_agency_name": "...", "central_bank_name": "...",
      "stock_exchange_name": "...", "updated_at": "..." }
  ]
}`,
        responses: [{ code: 200, description: 'Success' }],
      },
      {
        method: 'GET', path: '/v1/countries/{code}',
        description: 'One country, by alpha-2 (NG) or alpha-3 (NGA) code.',
        params: [{ name: 'code', type: 'string', required: true, description: 'ISO 3166-1 alpha-2 or alpha-3' }],
        responseExample: `{ "data": { "country_code": "NGA", "iso2_code": "NG", "country_name": "Nigeria", "...": "..." } }`,
        responses: [{ code: 200, description: 'Success' }, { code: 400, description: 'Invalid code' }, { code: 404, description: 'Unknown country' }],
      },
      {
        method: 'GET', path: '/v1/sdg-indicators',
        description: 'Active SDG indicators in the DevMapper registry.',
        params: [...pageParams, sdgParam],
        responseExample: `{
  "data": [
    { "id": "...", "indicator_code": "13.2.2", "indicator_name": "...", "sdg_id": 13, "target_id": "13.2",
      "unit": "...", "frequency": "...", "level": "...", "measurement_type": "...", "sector": "...",
      "source": "...", "verification_requirement": "..." }
  ],
  "meta": { "page": 1, "per_page": 25, "total": 0 }
}`,
        responses: listResponses,
      },
      {
        method: 'GET', path: '/v1/agenda2063-links',
        description: "How SDG targets map to the African Union's Agenda 2063.",
        params: [sdgParam],
        responseExample: `{
  "data": [
    { "id": "...", "sdg_goal": 4, "sdg_target": "4.1", "agenda_aspiration": 1, "agenda_goal": "...",
      "indicator_code": "...", "alignment_description": "...", "data_source": "..." }
  ]
}`,
        responses: listResponses,
      },
    ],
  },
  {
    category: 'Carbon Certificates',
    icon: <Award className="w-4 h-4" />,
    endpoints: [
      {
        method: 'GET', path: '/v1/certificates/{number}',
        description: 'Verify a carbon-credit retirement certificate by its number.',
        params: [{ name: 'number', type: 'string', required: true, description: 'Certificate number as printed' }],
        responseExample: `{
  "data": { "certificate_number": "...", "project_title": "...", "project_type": "reforestation",
            "methodology": "...", "country_code": "KE", "quantity": 25, "retired_at": "..." }
}`,
        responses: [{ code: 200, description: 'Certificate found' }, { code: 400, description: 'No number given' }, { code: 404, description: 'No such certificate' }],
      },
    ],
  },
  {
    category: 'Statistics',
    icon: <BarChart3 className="w-4 h-4" />,
    endpoints: [
      {
        method: 'GET', path: '/v1/stats',
        description: 'Counts of public projects: total, verified, by SDG and by country.',
        params: [],
        responseExample: `{
  "data": {
    "public_projects": 6,
    "verified_projects": 0,
    "projects_by_sdg": { "6": 2, "7": 1 },
    "projects_by_country": { "NG": 1, "KE": 2 }
  }
}`,
        responses: [{ code: 200, description: 'Success' }],
      },
    ],
  },
];

export const codeExamples = [
  {
    language: 'curl',
    code: `curl "${API_BASE_URL}/v1/projects?country=NG&sdg=6,7&per_page=10"`,
  },
  {
    language: 'JavaScript',
    code: `const res = await fetch('${API_BASE_URL}/v1/projects?country=KE&verified=true');
const { data, meta } = await res.json();
console.log(\`\${meta.total} verified projects in Kenya\`, data);`,
  },
  {
    language: 'Python',
    code: `import requests

r = requests.get("${API_BASE_URL}/v1/projects", params={"sdg": "6", "page": 1})
r.raise_for_status()
body = r.json()
for project in body["data"]:
    print(project["title"], project["country_code"])`,
  },
];
