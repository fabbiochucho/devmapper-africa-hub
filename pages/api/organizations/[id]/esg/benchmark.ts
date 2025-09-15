import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { getBenchmarkForOrg } from '@/lib/alphaearth';
import { writeESGAuditLog, ESGAuditHelpers } from '@/lib/esg-audit';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orgId = req.query.id as string;
  const { sector, year, country } = req.body;

  try {
    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .eq('created_by', userId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if ESG is enabled for this organization
    if (!org.esg_enabled) {
      return res.status(403).json({ error: 'ESG module not enabled for this organization' });
    }

    // Get benchmark data using AlphaEarth integration
    const benchmark = await getBenchmarkForOrg(
      org.plan_type,
      country || org.primary_sector || 'US',
      sector || org.primary_sector || 'services',
      year || org.reporting_year,
      orgId
    );

    // Get current ESG indicators for comparison
    const { data: indicators } = await supabase
      .from('esg_indicators')
      .select('*')
      .eq('organization_id', orgId)
      .eq('reporting_year', year || org.reporting_year);

    // Log the benchmark fetch
    await ESGAuditHelpers.logBenchmarkFetched(orgId, userId, benchmark.source.includes('Commercial') ? 'alphaearth' : 'gee', {
      country: country || org.primary_sector,
      sector: sector || org.primary_sector,
      year: year || org.reporting_year
    });

    // Calculate performance vs benchmark if indicators exist
    let performance = null;
    if (indicators && indicators.length > 0) {
      const latestIndicator = indicators[0];
      const totalEmissions = (latestIndicator.carbon_scope1_tonnes || 0) + 
                           (latestIndicator.carbon_scope2_tonnes || 0) + 
                           (latestIndicator.carbon_scope3_tonnes || 0);
      
      performance = {
        total_emissions: totalEmissions,
        benchmark_intensity: benchmark.avg_carbon_intensity,
        performance_ratio: benchmark.avg_carbon_intensity > 0 ? totalEmissions / benchmark.avg_carbon_intensity : null,
        status: totalEmissions < benchmark.avg_carbon_intensity ? 'better' : 'worse'
      };
    }

    return res.json({
      organization: org,
      benchmark,
      indicators: indicators || [],
      performance,
      fetched_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Benchmark API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch benchmark data',
      details: error.message 
    });
  }
}