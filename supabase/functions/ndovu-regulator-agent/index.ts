import { handleAgent } from "../_shared/agent-utils.ts";

const SYSTEM_PROMPT = `You are the Regulator AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: perform compliance gap analysis against ESG and carbon regulatory frameworks.
You have access to: esg_indicators, reporting_frameworks, framework_indicators, country_intelligence, carbon_compliance.

For every analysis:
1. Identify applicable frameworks based on country + sector + organization type
2. Map current esg_indicators data to required framework indicators
3. Calculate compliance score per framework (% of required indicators reported)
4. List specific gaps: which indicators are missing, which are below threshold
5. Prioritize gaps by: mandatory vs voluntary, enforcement risk, reporting deadline

Frameworks: GRI Universal 2021, IFRS S1/S2, CDP Climate, CSRD/ESRS, Nigeria SRG1.
Always cite specific framework article/standard number when flagging a gap.`;

Deno.serve((req) => handleAgent(req, "regulator_ai", SYSTEM_PROMPT, async (db, ctx, ev) => {
  const countries = ctx.plan?.countries ?? [];
  let policies = db.from("regulatory_frameworks").select("id, name, regulator_name, category, country_code, mandatory, status, effective_date, reporting_frequency, enforcement_risk, source_url").limit(15);
  if (countries.length) policies = policies.in("country_code", countries);
  const { data: regs } = await policies;
  ev.rows(regs, { label: (r) => `Regulation: ${r.name} (${r.country_code})`, entityType: "policy", id: (r) => r.id, path: (r) => `/explore/policy/${r.id}`, url: (r) => r.source_url ?? undefined, pick: ["name", "regulator_name", "category", "country_code", "mandatory", "status", "effective_date", "reporting_frequency", "enforcement_risk"] });
  const { data: frameworks } = await db.from("reporting_frameworks").select("id, code, name, is_mandatory, applicable_regions, version");
  ev.rows(frameworks, { label: (f) => `Framework: ${f.name}`, entityType: "framework", id: (f) => f.id, path: (f) => `/explore/framework/${f.id}`, pick: ["code", "name", "is_mandatory", "applicable_regions", "version"] });
  if (countries.length) {
    const { data: ci } = await db.from("country_intelligence").select("*").in("country_code", countries);
    ev.rows(ci, { label: (c) => `Country intelligence: ${c.country_name}`, entityType: "country", id: (c) => c.country_code, path: (c) => `/explore/country/${c.country_code}`, pick: ["country_name", "esg_regulatory_status", "climate_disclosure_status", "carbon_market_maturity", "environmental_agency_name", "enforcement_intensity_index"] });
  }
  const { data: esg } = await db.from("esg_indicators").select("reporting_year, esg_score, carbon_scope1_tonnes, carbon_scope2_tonnes, carbon_scope3_tonnes, renewable_energy_percentage, verification_status").order("reporting_year", { ascending: false }).limit(3);
  ev.rows(esg, { label: (e) => `Your ESG data, ${e.reporting_year}` });
}));
