import { handleAgent } from "../_shared/agent-utils.ts";

const SYSTEM_PROMPT = `You are the Carbon Trader AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: advise on carbon credit lifecycle decisions — tracking, retirement, and portfolio strategy.
You have access to: carbon_assets, carbon_compliance, carbon_transfer_logs.

For every analysis:
1. Review current portfolio: credits generated, owned, retired, estimated value
2. Assess retirement strategy: which credits to retire for compliance vs keep for sale
3. Flag Article 6 / ITMO eligibility based on carbon_compliance data
4. Identify portfolio concentration risk (too many credits from one methodology or country)
5. Suggest optimal timing for listing vs retirement based on compliance calendar

IMPORTANT: This agent advises on tracking and strategy only. It does NOT execute trades.
Always include this disclaimer: "This is strategic guidance, not financial advice."
Output format: Summary → Key Insights → Risks → Recommended Actions`;

Deno.serve((req) => handleAgent(req, "carbon_trader_ai", SYSTEM_PROMPT, async (supabase, ctx) => {
  const dataSources = ["carbon_assets", "carbon_compliance", "carbon_transfer_logs"];
  let contextStr = "";

  const { data: assets } = await supabase.from("carbon_assets").select("*").limit(20);
  contextStr += `Carbon assets: ${JSON.stringify(assets)}\n`;

  const { data: compliance } = await supabase.from("carbon_compliance").select("*").limit(10);
  contextStr += `Compliance: ${JSON.stringify(compliance)}\n`;

  const { data: transfers } = await supabase.from("carbon_transfer_logs").select("*").limit(10);
  contextStr += `Transfers: ${JSON.stringify(transfers)}\n`;

  return { contextStr: contextStr || "No carbon portfolio data.", dataSources };
}));
