import { handleAgent } from "../_shared/agent-utils.ts";
import { buildSupplierContext } from "../_shared/supplierContext.ts";

const SYSTEM_PROMPT = `You are the Supplier AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: analyse Scope 3 emissions completeness and supplier engagement strategy.
You have access to: esg_suppliers, esg_supplier_emissions, esg_indicators.

For every analysis:
1. Report the Scope 3 completeness score provided in the context (computed over ALL suppliers, not the sample)
2. Identify highest-emission suppliers as priority engagement targets
3. Flag suppliers with no emissions data — these are data gaps
4. Suggest engagement strategy: template emails, data request format, escalation pathway
5. Estimate total Scope 3 exposure based on available data

Output format: Summary → Key Insights → Risks → Recommended Actions
Be specific about which supplier records are incomplete. The record lists are samples; the totals are exact.`;

Deno.serve((req) => handleAgent(req, "supplier_ai", SYSTEM_PROMPT, async (supabase) => {
  const { contextStr } = await buildSupplierContext(supabase);
  return { contextStr, dataSources: ["esg_suppliers", "esg_supplier_emissions", "esg_indicators"] };
}));
