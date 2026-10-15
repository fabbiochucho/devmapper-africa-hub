// DevMapper Public API v1 - read-only access to DevMapper's public data.
//
// Every query runs with the anon key, so Row Level Security decides what is visible:
// the API can never return anything a signed-out visitor couldn't already see in the app.
// Only public, non-personal columns are selected (no user ids, emails or phone numbers).
// No API key is needed. Writes are not offered - they happen in the app, where users are
// authenticated and their submissions go through verification.
//
// Base URL: https://ptfrzwsivtetvmdotfui.supabase.co/functions/v1/public-api
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Database } from '../_shared/db.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECT_FIELDS = 'id, title, description, sdg_goal, sdg_target, project_status, location, country_code, lat, lng, cost, cost_currency, beneficiaries, funder, sponsor, contractor, start_date, end_date, is_verified, verification_count, submitted_at, updated_at';
const CHANGE_MAKER_FIELDS = 'id, title, description, impact_description, location, country_code, sdg_goals, projects_count, total_funding, image_url, is_verified, created_at';
const CAMPAIGN_FIELDS = 'id, title, description, category, location, sdg_goals, currency, target_amount, raised_amount, deadline, status, image_url, is_verified, report_id, created_at';
const COUNTRY_FIELDS = 'country_code, iso2_code, country_name, currency_code, official_languages, regional_blocs, legal_system_type, esg_regulatory_status, climate_disclosure_status, carbon_market_maturity, digital_reporting_maturity, environmental_agency_name, central_bank_name, stock_exchange_name, updated_at';
const INDICATOR_FIELDS = 'id, indicator_code, indicator_name, sdg_id, target_id, unit, frequency, level, measurement_type, sector, source, verification_requirement';
const AGENDA_FIELDS = 'id, sdg_goal, sdg_target, agenda_aspiration, agenda_goal, indicator_code, alignment_description, data_source';
const CERTIFICATE_FIELDS = 'certificate_number, project_title, project_type, methodology, country_code, quantity, retired_at';
const MILESTONE_FIELDS = 'id, title, description, status, completion_percentage, target_date, sdg_indicators, updated_at';

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const json = (body: unknown, status = 200, cache = true) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      ...(cache && status === 200 ? { 'Cache-Control': 'public, max-age=300' } : {}),
    },
  });

function paging(params: URLSearchParams) {
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') ?? '25', 10) || 25));
  return { page, perPage, from: (page - 1) * perPage, to: page * perPage - 1 };
}

function intList(value: string | null, name: string, min: number, max: number): number[] | null {
  if (!value) return null;
  const list = value.split(',').map((v) => parseInt(v.trim(), 10));
  if (list.some((n) => !Number.isInteger(n) || n < min || n > max)) throw new ApiError(400, `${name} must be comma-separated integers from ${min} to ${max}`);
  return list;
}

function countryCode(value: string | null): string | null {
  if (!value) return null;
  if (!/^[A-Za-z]{2,3}$/.test(value)) throw new ApiError(400, 'country must be an ISO 3166-1 alpha-2 or alpha-3 code');
  return value.toUpperCase();
}

// Escape characters PostgREST treats specially inside an ilike/or() filter.
const searchTerm = (q: string) => q.replace(/[%_,()*\\]/g, ' ').trim().slice(0, 100);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Only GET is supported; this API is read-only.' }, 405, false);

  const url = new URL(req.url);
  // Path after the function name, e.g. /public-api/v1/projects -> ['v1', 'projects']
  const parts = url.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('public-api');
  const [version, resource, id, sub] = parts.slice(at + 1);
  const params = url.searchParams;

  const db = createClient<Database>(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    auth: { persistSession: false },
  });

  try {
    if (!version) {
      return json({
        name: 'DevMapper Public API',
        version: 'v1',
        docs: 'https://devmapper.africa/resources',
        endpoints: ['/v1/projects', '/v1/projects/{id}', '/v1/projects/{id}/milestones', '/v1/change-makers', '/v1/campaigns', '/v1/countries', '/v1/countries/{code}', '/v1/sdg-indicators', '/v1/agenda2063-links', '/v1/certificates/{number}', '/v1/stats'],
      });
    }
    if (version !== 'v1') throw new ApiError(404, `Unknown API version '${version}'. Use v1.`);

    switch (resource) {
      case 'projects': {
        if (id && !/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(404, 'Project not found');
        if (id && sub === 'milestones') {
          const { data, error } = await db.from('project_milestones').select(MILESTONE_FIELDS).eq('report_id', id).order('target_date', { ascending: true, nullsFirst: false });
          if (error) throw error;
          return json({ data });
        }
        if (id) {
          const { data, error } = await db.from('reports').select(PROJECT_FIELDS).eq('id', id).eq('visibility', 'public').maybeSingle();
          if (error) throw error;
          if (!data) throw new ApiError(404, 'Project not found');
          return json({ data });
        }
        const { page, perPage, from, to } = paging(params);
        let q = db.from('reports').select(PROJECT_FIELDS, { count: 'exact' }).eq('visibility', 'public');
        const country = countryCode(params.get('country'));
        if (country) q = q.eq('country_code', country);
        const sdg = intList(params.get('sdg'), 'sdg', 1, 17);
        if (sdg) q = q.in('sdg_goal', sdg);
        if (params.get('status')) q = q.eq('project_status', params.get('status')!);
        if (params.get('verified') === 'true') q = q.eq('is_verified', true);
        if (params.get('search')) {
          const term = searchTerm(params.get('search')!);
          if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
        }
        const sort = params.get('sort') === 'title' ? 'title' : params.get('sort') === 'updated_at' ? 'updated_at' : 'submitted_at';
        const { data, error, count } = await q.order(sort, { ascending: sort === 'title' }).range(from, to);
        if (error) throw error;
        return json({ data, meta: { page, per_page: perPage, total: count ?? 0 } });
      }

      case 'change-makers': {
        const { page, perPage, from, to } = paging(params);
        let q = db.from('change_makers').select(CHANGE_MAKER_FIELDS, { count: 'exact' });
        const country = countryCode(params.get('country'));
        if (country) q = q.eq('country_code', country);
        const sdg = intList(params.get('sdg'), 'sdg', 1, 17);
        if (sdg) q = q.overlaps('sdg_goals', sdg);
        const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
        if (error) throw error;
        return json({ data, meta: { page, per_page: perPage, total: count ?? 0 } });
      }

      case 'campaigns': {
        const { page, perPage, from, to } = paging(params);
        let q = db.from('fundraising_campaigns').select(CAMPAIGN_FIELDS, { count: 'exact' });
        if (params.get('status')) q = q.eq('status', params.get('status')!);
        const sdg = intList(params.get('sdg'), 'sdg', 1, 17);
        if (sdg) q = q.overlaps('sdg_goals', sdg);
        const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to);
        if (error) throw error;
        return json({ data, meta: { page, per_page: perPage, total: count ?? 0 } });
      }

      case 'countries': {
        if (id) {
          const code = countryCode(id)!;
          const { data, error } = await db.from('country_intelligence').select(COUNTRY_FIELDS).or(`country_code.eq.${code},iso2_code.eq.${code}`).maybeSingle();
          if (error) throw error;
          if (!data) throw new ApiError(404, 'Country not found');
          return json({ data });
        }
        const { data, error } = await db.from('country_intelligence').select(COUNTRY_FIELDS).order('country_name');
        if (error) throw error;
        return json({ data });
      }

      case 'sdg-indicators': {
        const { page, perPage, from, to } = paging(params);
        let q = db.from('sdg_indicators').select(INDICATOR_FIELDS, { count: 'exact' }).eq('is_active', true);
        const sdg = intList(params.get('sdg'), 'sdg', 1, 17);
        if (sdg) q = q.in('sdg_id', sdg);
        const { data, error, count } = await q.order('indicator_code').range(from, to);
        if (error) throw error;
        return json({ data, meta: { page, per_page: perPage, total: count ?? 0 } });
      }

      case 'agenda2063-links': {
        let q = db.from('agenda2063_links').select(AGENDA_FIELDS);
        const sdg = intList(params.get('sdg'), 'sdg', 1, 17);
        if (sdg) q = q.in('sdg_goal', sdg);
        const { data, error } = await q.order('sdg_goal');
        if (error) throw error;
        return json({ data });
      }

      case 'certificates': {
        if (!id) throw new ApiError(400, 'Give a certificate number: /v1/certificates/{number}');
        const { data, error } = await db.from('retirement_certificates').select(CERTIFICATE_FIELDS).eq('certificate_number', id).maybeSingle();
        if (error) throw error;
        if (!data) throw new ApiError(404, 'Certificate not found');
        return json({ data });
      }

      case 'stats': {
        // Counts of public projects by SDG and by country.
        // ponytail: aggregates up to 10k rows in the function; move to a SQL view/RPC past that.
        const { data, error } = await db.from('reports').select('sdg_goal, country_code, is_verified').eq('visibility', 'public').limit(10000);
        if (error) throw error;
        const bySdg: Record<string, number> = {};
        const byCountry: Record<string, number> = {};
        let verified = 0;
        for (const r of data ?? []) {
          if (r.sdg_goal != null) bySdg[r.sdg_goal] = (bySdg[r.sdg_goal] ?? 0) + 1;
          if (r.country_code) byCountry[r.country_code] = (byCountry[r.country_code] ?? 0) + 1;
          if (r.is_verified) verified++;
        }
        return json({ data: { public_projects: data?.length ?? 0, verified_projects: verified, projects_by_sdg: bySdg, projects_by_country: byCountry } });
      }

      default:
        throw new ApiError(404, `Unknown resource '${resource ?? ''}'. See GET /public-api for the list.`);
    }
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status, false);
    console.error('[PUBLIC-API]', error);
    return json({ error: 'Internal server error' }, 500, false);
  }
});
