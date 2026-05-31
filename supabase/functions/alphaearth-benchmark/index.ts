import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ALPHAEARTH_API_BASE = 'https://api.alphaearth.ai';
const ALPHAEARTH_API_KEY = Deno.env.get('ALPHAEARTH_API_KEY');

interface BenchmarkRequest {
  organizationId: string;
  sector?: string;
  region?: string;
  year?: number;
}

interface BenchmarkResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Error response helper
 */
function errorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Success response helper
 */
function successResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Get benchmark data from AlphaEarth API
 */
async function getBenchmark(req: BenchmarkRequest): Promise<unknown> {
  if (!ALPHAEARTH_API_KEY) {
    throw new Error('ALPHAEARTH_API_KEY not configured in Supabase secrets');
  }

  const params = new URLSearchParams();
  if (req.sector) params.append('sector', req.sector);
  if (req.region) params.append('region', req.region);
  if (req.year) params.append('year', String(req.year));

  const url = `${ALPHAEARTH_API_BASE}/benchmarks?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ALPHAEARTH_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`AlphaEarth API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Enrich supplier emissions with AlphaEarth data
 */
async function enrichSupplierEmissions(req: {
  supplierId: string;
  supplierName: string;
  category: string;
}): Promise<unknown> {
  if (!ALPHAEARTH_API_KEY) {
    throw new Error('ALPHAEARTH_API_KEY not configured');
  }

  const response = await fetch(`${ALPHAEARTH_API_BASE}/enrichment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ALPHAEARTH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      supplier_name: req.supplierName,
      category: req.category,
    }),
  });

  if (!response.ok) {
    throw new Error(`AlphaEarth enrichment error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get API usage statistics
 */
async function getUsageStats(req: { organizationId: string }): Promise<unknown> {
  if (!ALPHAEARTH_API_KEY) {
    throw new Error('ALPHAEARTH_API_KEY not configured');
  }

  const response = await fetch(`${ALPHAEARTH_API_BASE}/usage?org_id=${req.organizationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ALPHAEARTH_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Non-critical - return empty stats if API fails
    return { calls_used: 0, calls_limit: 0 };
  }

  return await response.json();
}

/**
 * Main handler
 */
serve(async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  // Verify auth token from client
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(401, 'Missing or invalid authorization token');
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'benchmark';

    let body: unknown;
    if (req.method === 'POST') {
      body = await req.json();
    }

    let result: unknown;

    switch (action) {
      case 'benchmark':
        result = await getBenchmark(body as BenchmarkRequest);
        break;
      case 'enrich':
        result = await enrichSupplierEmissions(
          body as { supplierId: string; supplierName: string; category: string }
        );
        break;
      case 'usage':
        result = await getUsageStats(body as { organizationId: string });
        break;
      default:
        return errorResponse(400, `Unknown action: ${action}`);
    }

    const response = successResponse(result);
    // Add CORS headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('[alphaearth-benchmark]', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(500, message);
  }
});
