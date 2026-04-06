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
Output format: Summary → Key Insights → Risks → Recommended Actions
Always cite specific framework article/standard number when flagging a gap.`;

Deno.serve((req) => handleAgent(req, "regulator_ai", SYSTEM_PROMPT, async (supabase, ctx) => {
  const dataSources = ["esg_indicators", "reporting_frameworks", "framework_indicators", "country_intelligence"];
  let contextStr = "";

  const { data: frameworks } = await supabase.from("reporting_frameworks").select("code, name, is_mandatory, applicable_regions");
  contextStr += `Frameworks: ${JSON.stringify(frameworks)}\n`;

  const { data: indicators } = await supabase.from("framework_indicators").select("indicator_code, indicator_name, metric_key, framework_id").limit(50);
  contextStr += `Framework indicators: ${JSON.stringify(indicators)}\n`;

  if (ctx.userId) {
    const { data: esgData } = await supabase.from("esg_indicators").select("*").limit(5);
    contextStr += `ESG data: ${JSON.stringify(esgData)}\n`;
  }

  const { data: countryData } = await supabase.from("country_intelligence").select("*").limit(5);
  contextStr += `Country intelligence: ${JSON.stringify(countryData)}\n`;

  return { contextStr, dataSources };
}));
