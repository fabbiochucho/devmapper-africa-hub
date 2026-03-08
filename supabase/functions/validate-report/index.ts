import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { report_id } = await req.json();
    if (!report_id) throw new Error('report_id is required');

    // Fetch the report
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) throw new Error('Report not found');

    // AI validation rules (rule-based for now, can be upgraded to LLM later)
    const issues: { field: string; severity: 'error' | 'warning' | 'info'; message: string }[] = [];
    let score = 100;

    // 1. Title quality
    if (report.title.length < 10) {
      issues.push({ field: 'title', severity: 'warning', message: 'Title is too short. Consider a more descriptive title.' });
      score -= 10;
    }

    // 2. Description quality
    if (report.description.length < 50) {
      issues.push({ field: 'description', severity: 'warning', message: 'Description is too brief. Include project objectives, methods, and expected outcomes.' });
      score -= 15;
    }

    // 3. Missing evidence
    if (!report.evidence_url) {
      issues.push({ field: 'evidence_url', severity: 'warning', message: 'No evidence uploaded. Reports with evidence are 3x more likely to be verified.' });
      score -= 10;
    }

    // 4. Location validation
    if (!report.location && !report.lat) {
      issues.push({ field: 'location', severity: 'error', message: 'Missing location. All SDG projects must have a geographic reference.' });
      score -= 20;
    }

    // 5. SDG goal validity
    if (report.sdg_goal < 1 || report.sdg_goal > 17) {
      issues.push({ field: 'sdg_goal', severity: 'error', message: 'Invalid SDG goal. Must be between 1 and 17.' });
      score -= 20;
    }

    // 6. Cost sanity check
    if (report.cost && report.cost > 1_000_000_000) {
      issues.push({ field: 'cost', severity: 'warning', message: 'Unusually high cost. Please verify the amount and currency.' });
      score -= 5;
    }

    // 7. Date consistency
    if (report.start_date && report.end_date && report.start_date > report.end_date) {
      issues.push({ field: 'end_date', severity: 'error', message: 'End date is before start date.' });
      score -= 15;
    }

    // 8. Beneficiaries
    if (report.beneficiaries && report.beneficiaries < 0) {
      issues.push({ field: 'beneficiaries', severity: 'error', message: 'Beneficiaries count cannot be negative.' });
      score -= 10;
    }

    // 9. Country code present
    if (!report.country_code) {
      issues.push({ field: 'country_code', severity: 'warning', message: 'No country code. This affects regional analytics.' });
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    const result = {
      report_id,
      validation_score: score,
      status: score >= 70 ? 'pass' : score >= 40 ? 'needs_review' : 'fail',
      issues,
      validated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VALIDATE-REPORT] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
