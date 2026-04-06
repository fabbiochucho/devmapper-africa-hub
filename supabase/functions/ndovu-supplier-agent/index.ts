import { handleAgent } from "../_shared/agent-utils.ts";

const SYSTEM_PROMPT = `You are the Supplier AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: analyse Scope 3 emissions completeness and supplier engagement strategy.
You have access to: esg_suppliers, esg_supplier_emissions, esg_indicators.

For every analysis:
1. Calculate Scope 3 completeness score: (suppliers with emissions data / total suppliers) × 100
2. Identify highest-emission suppliers as priority engagement targets
3. Flag suppliers with no emissions data — these are data gaps
4. Suggest engagement strategy: template emails, data request format, escalation pathway
5. Estimate total Scope 3 exposure based on available data

Output format: Summary → Key Insights → Risks → Recommended Actions
Be specific about which supplier records are incomplete.`;

Deno.serve((req) => handleAgent(req, "supplier_ai", SYSTEM_PROMPT, async (supabase, ctx) => {
  const dataSources = ["esg_suppliers", "esg_supplier_emissions", "esg_indicators"];
  let contextStr = "";

  const { data: suppliers } = await supabase.from("esg_suppliers").select("id, name, sector, country_code").limit(50);
  contextStr += `Suppliers (${suppliers?.length || 0}): ${JSON.stringify(suppliers)}\n`;

  const { data: emissions } = await supabase.from("esg_supplier_emissions").select("supplier_id, emissions_tonnes, data_quality, reporting_year").limit(50);
  contextStr += `Supplier emissions: ${JSON.stringify(emissions)}\n`;

  return { contextStr: contextStr || "No supplier data available.", dataSources };
}));
