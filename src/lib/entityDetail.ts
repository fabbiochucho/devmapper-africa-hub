import { supabase } from "@/integrations/supabase/client";
import { sdgGoals } from "@/lib/constants";
import { sourceName } from "@/lib/entities";

export interface Detail {
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  facts: [string, string | number | null | undefined][];
  source?: { name: string; url?: string | null; fetchedAt?: string | null; publishedAt?: string | null };
}

const humanize = (k: string) => k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const show = (v: unknown) => (v === null || v === undefined || v === "" ? null : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? null : String(v));

export async function loadDetail(type: string, id: string): Promise<Detail | null> {
  switch (type) {
    case "project": {
      const { data: r } = await supabase.from("reports").select("title, description, location, country_code, sdg_goal, project_status, cost, cost_currency, beneficiaries, start_date, end_date, is_verified, verification_count, funder").eq("id", id).maybeSingle();
      return r && {
        title: r.title, summary: r.description,
        facts: [["Country", r.country_code], ["Location", r.location], ["SDG", r.sdg_goal], ["Status", r.project_status],
          ["Budget", r.cost ? `${r.cost_currency ?? "USD"} ${r.cost.toLocaleString()}` : null], ["Beneficiaries", r.beneficiaries],
          ["Start", r.start_date], ["End", r.end_date], ["Funder", r.funder], ["Verified", r.is_verified ? "Yes" : "No"], ["Verifications", r.verification_count]],
        source: { name: "DevMapper" },
      };
    }
    case "organization": {
      const { data: o } = await supabase.from("organizations").select("name, primary_sector, incorporation_country, operating_countries").eq("id", id).maybeSingle();
      if (o) return { title: o.name, facts: [["Sector", o.primary_sector], ["Incorporated in", o.incorporation_country], ["Operates in", show(o.operating_countries)]], source: { name: "DevMapper" } };
      break;
    }
    case "country": {
      const { data: c } = await supabase.from("country_intelligence").select("*").eq("country_code", id).maybeSingle();
      if (!c) return { title: id, facts: [] };
      return {
        title: c.country_name, subtitle: c.country_code,
        facts: [
          ["ESG regulation", c.esg_regulatory_status], ["Climate disclosure", c.climate_disclosure_status],
          ["Carbon market maturity", c.carbon_market_maturity], ["Environmental agency", c.environmental_agency_name],
          ["Central bank", c.central_bank_name], ["Stock exchange", c.stock_exchange_name], ["Currency", c.currency_code],
          ["Regional blocs", show(c.regional_blocs)], ["Official languages", show(c.official_languages)],
        ],
        source: { name: "DevMapper country intelligence", fetchedAt: c.updated_at },
      };
    }
    case "sdg": {
      const g = sdgGoals.find((s) => s.value === id);
      return g ? { title: g.label, facts: [], summary: "Projects, campaigns and indicators linked to this goal are listed under Connections." } : null;
    }
    case "framework": {
      const { data: f } = await supabase.from("reporting_frameworks").select("*").eq("id", id).maybeSingle();
      return f && { title: f.name, subtitle: f.code, facts: [["Category", f.category], ["Version", f.version], ["Mandatory", f.is_mandatory ? "Yes" : "No"], ["Regions", show(f.applicable_regions)]], source: { name: "DevMapper standards library" } };
    }
    case "indicator": {
      const { data: i } = await supabase.from("framework_indicators").select("*").eq("id", id).maybeSingle();
      return i && { title: i.indicator_name, subtitle: i.indicator_code, summary: i.description, facts: [["Unit", i.unit_of_measure], ["SDG alignment", show(i.sdg_alignment)]], source: { name: "DevMapper standards library" } };
    }
    case "person": {
      const { data: p } = await supabase.from("public_profiles").select("full_name, organization, country").eq("user_id", id).maybeSingle();
      return p && { title: p.full_name ?? "DevMapper member", facts: [["Organisation", p.organization], ["Country", p.country]] };
    }
    case "policy": {
      const { data: r } = await supabase.from("regulatory_frameworks").select("*").eq("id", id).maybeSingle();
      if (r) return {
        title: r.name, subtitle: r.regulator_name,
        facts: [["Country", r.country_code], ["Category", r.category], ["Status", r.status], ["Mandatory", r.mandatory ? "Yes" : "No"],
          ["Effective", r.effective_date], ["Reporting frequency", r.reporting_frequency], ["Enforcement risk", r.enforcement_risk]],
        source: { name: "DevMapper regulatory library", url: r.source_url, fetchedAt: r.updated_at },
      };
      break;
    }
  }
  const { data: e } = await supabase.from("entities").select("*").eq("id", id).maybeSingle();
  if (!e) return null;
  const attrs = e.attributes && typeof e.attributes === "object" && !Array.isArray(e.attributes) ? Object.entries(e.attributes) : [];
  return {
    title: e.title, summary: e.summary,
    facts: [["Country", e.country_code], ...attrs.map(([k, v]) => [humanize(k), show(v)] as [string, string | null])],
    source: { name: sourceName(e.source), url: e.source_url, fetchedAt: e.fetched_at, publishedAt: e.published_at },
  };
}
