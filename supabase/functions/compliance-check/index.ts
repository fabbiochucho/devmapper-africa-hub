import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Scheduled Compliance Agent
 * 
 * Runs periodically (via pg_cron) to:
 * 1. Scan all organizations with regulatory exposure profiles
 * 2. Check for upcoming compliance deadlines
 * 3. Detect data gaps in ESG indicators
 * 4. Generate compliance alerts as notifications
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const results: any[] = [];

    // 1. Get all organizations with ESG enabled
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, incorporation_country, operating_countries, esg_enabled, reporting_year, sector_code, created_by")
      .eq("esg_enabled", true);

    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: "No ESG-enabled organizations to check", results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const org of orgs) {
      const alerts: string[] = [];
      const orgYear = org.reporting_year || currentYear;

      // 2. Check for missing ESG indicator data for reporting year
      const { data: indicators } = await supabase
        .from("esg_indicators")
        .select("*")
        .eq("organization_id", org.id)
        .eq("reporting_year", orgYear)
        .limit(1);

      if (!indicators || indicators.length === 0) {
        alerts.push(`No ESG indicators submitted for reporting year ${orgYear}. Submit data to maintain compliance.`);
      } else {
        const ind = indicators[0];
        const missingFields: string[] = [];
        if (ind.carbon_scope1_tonnes === null) missingFields.push("Scope 1 emissions");
        if (ind.carbon_scope2_tonnes === null) missingFields.push("Scope 2 emissions");
        if (ind.energy_consumption_kwh === null) missingFields.push("Energy consumption");
        if (ind.water_consumption_m3 === null) missingFields.push("Water consumption");
        if (ind.waste_generated_tonnes === null) missingFields.push("Waste generated");

        if (missingFields.length > 0) {
          alerts.push(`Missing ESG data for ${orgYear}: ${missingFields.join(", ")}. Complete these to meet disclosure requirements.`);
        }

        if (ind.verification_status !== "verified") {
          alerts.push(`ESG data for ${orgYear} is unverified. Submit for third-party verification to improve compliance score.`);
        }
      }

      // 3. Check supplier emissions coverage (Scope 3)
      const { count: supplierCount } = await supabase
        .from("esg_suppliers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);

      const { count: emissionsCount } = await supabase
        .from("esg_supplier_emissions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("reporting_year", orgYear);

      if ((supplierCount || 0) > 0 && (emissionsCount || 0) < (supplierCount || 0)) {
        alerts.push(`Only ${emissionsCount || 0}/${supplierCount} suppliers have emissions data for ${orgYear}. Complete Scope 3 reporting.`);
      }

      // 4. Check regulatory exposure profile freshness
      const { data: exposureProfiles } = await supabase
        .from("regulatory_exposure_profiles")
        .select("last_assessed_at, risk_level, compliance_score")
        .eq("user_id", org.created_by)
        .limit(1);

      if (!exposureProfiles || exposureProfiles.length === 0) {
        alerts.push("No regulatory exposure assessment found. Run a compliance assessment to identify applicable frameworks.");
      } else {
        const profile = exposureProfiles[0];
        const lastAssessed = new Date(profile.last_assessed_at);
        const daysSince = Math.floor((now.getTime() - lastAssessed.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince > 90) {
          alerts.push(`Regulatory exposure profile is ${daysSince} days old. Re-assess to capture regulatory changes.`);
        }

        if (profile.risk_level === "high") {
          alerts.push(`High regulatory risk detected (compliance score: ${profile.compliance_score}%). Immediate action recommended.`);
        }
      }

      // 5. Create notifications for each alert
      if (alerts.length > 0) {
        const notifications = alerts.map(alert => ({
          user_id: org.created_by,
          type: "warning",
          title: `Compliance Alert: ${org.name}`,
          message: alert,
          link: "/esg",
          metadata: { org_id: org.id, agent: "compliance-check", generated_at: now.toISOString() },
        }));

        await supabase.from("notifications").insert(notifications);

        // Log audit event
        await supabase.rpc("log_audit_event", {
          p_actor_id: org.created_by,
          p_actor_type: "system",
          p_org_id: org.id,
          p_action: "compliance_check_completed",
          p_payload: { alerts_count: alerts.length, alerts },
        });
      }

      results.push({ org_id: org.id, org_name: org.name, alerts_count: alerts.length, alerts });
    }

    return new Response(JSON.stringify({
      message: `Compliance check completed for ${orgs.length} organizations`,
      timestamp: now.toISOString(),
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compliance-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
