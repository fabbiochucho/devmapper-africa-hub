import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RuleEngineCheck {
  passed: boolean;
  violations: string[];
  sanitizedOutput: Record<string, unknown>;
}

const DEVMAPPER_TABLES = [
  "reports", "verification_records", "evidence_items", "carbon_assets",
  "esg_indicators", "esg_suppliers", "esg_supplier_emissions", "carbon_compliance",
  "carbon_transfer_logs", "reporting_frameworks", "framework_indicators",
  "country_intelligence", "fundraising_campaigns", "agenda2063_links",
  "corporate_targets", "organizations", "profiles",
];

function runRules(output: Record<string, unknown>, contextData?: Record<string, unknown>): RuleEngineCheck {
  const violations: string[] = [];
  const sanitized = { ...output };

  // Rule 1: CONFIDENCE_TOO_LOW
  const confidence = (output.confidenceScore ?? output.overallConfidence ?? 50) as number;
  if (confidence < 40) {
    violations.push("CONFIDENCE_TOO_LOW");
    sanitized.summary = "Insufficient data for reliable analysis. Please add more project data and try again.";
    sanitized.keyInsights = [];
    sanitized.risks = [];
    sanitized.recommendedActions = [];
    return { passed: false, violations, sanitizedOutput: sanitized };
  }

  // Rule 2: PII_LEAK
  const text = JSON.stringify(output);
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+?\d{10,15}/g;
  if (emailRegex.test(text) || phoneRegex.test(text)) {
    violations.push("PII_LEAK");
    const cleaned = text.replace(emailRegex, "[REDACTED_EMAIL]").replace(phoneRegex, "[REDACTED_PHONE]");
    try {
      Object.assign(sanitized, JSON.parse(cleaned));
    } catch { /* keep original */ }
  }

  // Rule 3: LEGAL_DISCLAIMER_MISSING
  const summaryStr = String(output.summary || "");
  if ((summaryStr.includes("advice") || summaryStr.includes("recommend")) && !summaryStr.includes("Not legal or financial advice")) {
    violations.push("LEGAL_DISCLAIMER_MISSING");
    sanitized.disclaimer = "AI-generated guidance. Not legal or financial advice.";
  }

  // Rule 4: DATA_SCOPE_VIOLATION
  const sources = (output.dataSources || []) as string[];
  const invalidSources = sources.filter(s => !DEVMAPPER_TABLES.includes(s) && !s.startsWith("http"));
  if (invalidSources.length > 0) {
    violations.push("DATA_SCOPE_VIOLATION");
  }

  return { passed: violations.length === 0, violations, sanitizedOutput: sanitized };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const body = await req.json();
  const { sessionId, output, contextData } = body;

  const result = runRules(output, contextData);

  // Log violations
  if (result.violations.length > 0) {
    await supabaseAdmin.from("ai_audit_log").insert({
      user_id: user.id,
      session_id: sessionId,
      agent_name: "rule_engine",
      action: "validation",
      output_summary: `Violations: ${result.violations.join(", ")}`,
      rule_engine_result: result,
    });
  }

  return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
