import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExposureResult {
  framework_name: string;
  category: string;
  mandatory: boolean;
  enforcement_risk: string | null;
  reporting_frequency: string | null;
  compliance_status: "compliant" | "partial" | "non_compliant" | "unknown";
  gaps: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { action, country_code, actor_type, sector_code } = await req.json();

    if (action === "assess") {
      // Fetch applicable frameworks for the country
      const { data: frameworks } = await supabase
        .from("regulatory_frameworks")
        .select("*")
        .eq("country_code", country_code)
        .eq("status", "active");

      if (!frameworks || frameworks.length === 0) {
        return new Response(JSON.stringify({
          exposure: [],
          summary: { total: 0, mandatory: 0, compliance_score: 0 },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Filter frameworks by actor type applicability
      const applicable = frameworks.filter((f: any) => {
        const types = f.applicable_entity_types as string[];
        return types?.includes(actor_type) || types?.includes("all");
      });

      // Build exposure profile
      const results: ExposureResult[] = applicable.map((f: any) => {
        const gaps: string[] = [];
        
        // Simple rule matching based on framework category
        if (f.category === "esg_disclosure" || f.category === "climate") {
          gaps.push("Verify ESG indicators are submitted for current reporting year");
        }
        if (f.category === "carbon_emissions") {
          gaps.push("Ensure Scope 1, 2, 3 emissions data is recorded");
        }
        if (f.mandatory) {
          gaps.push(`Mandatory compliance required — enforcement risk: ${f.enforcement_risk || "unknown"}`);
        }

        return {
          framework_name: f.name,
          category: f.category,
          mandatory: f.mandatory,
          enforcement_risk: f.enforcement_risk,
          reporting_frequency: f.reporting_frequency,
          compliance_status: "unknown" as const,
          gaps,
        };
      });

      const mandatoryCount = results.filter(r => r.mandatory).length;
      const score = results.length > 0 ? Math.round(((results.length - mandatoryCount * 0.5) / results.length) * 100) : 0;

      // Upsert exposure profile
      await supabase.from("regulatory_exposure_profiles").upsert({
        user_id: user.id,
        country_code,
        actor_type,
        sector_code: sector_code || null,
        exposure_categories: results.map(r => r.category),
        mandatory_frameworks: results.filter(r => r.mandatory).map(r => r.framework_name),
        voluntary_frameworks: results.filter(r => !r.mandatory).map(r => r.framework_name),
        compliance_score: score,
        risk_level: mandatoryCount > 3 ? "high" : mandatoryCount > 1 ? "medium" : "low",
        last_assessed_at: new Date().toISOString(),
      }, { onConflict: "user_id,country_code" });

      return new Response(JSON.stringify({
        exposure: results,
        summary: {
          total: results.length,
          mandatory: mandatoryCount,
          compliance_score: score,
          risk_level: mandatoryCount > 3 ? "high" : mandatoryCount > 1 ? "medium" : "low",
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rule-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
