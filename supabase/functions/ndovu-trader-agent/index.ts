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
Always include this disclaimer: "This is strategic guidance, not financial advice."`;

Deno.serve((req) => handleAgent(req, "carbon_trader_ai", SYSTEM_PROMPT, async (db, _ctx, ev) => {
  const { data: assets } = await db.from("carbon_assets").select("id, methodology, credits_generated, credits_owned, credits_retired, reference_price_usd, estimated_value_usd, verification_status, issuance_date").limit(20);
  ev.rows(assets, { label: (a) => `Carbon asset: ${a.methodology ?? "unspecified methodology"} (${a.verification_status ?? "unverified"})`, path: () => "/carbon-portfolio" });
  const { data: compliance } = await db.from("carbon_compliance").select("compliance_type, jurisdiction, article6_status, itmo_eligible, er_credits_issued, country_of_origin").limit(10);
  ev.rows(compliance, { label: (c) => `Carbon compliance: ${c.compliance_type} in ${c.jurisdiction ?? "unspecified jurisdiction"}` });
  const { data: transfers } = await db.from("carbon_transfer_logs").select("transfer_date, credits_transferred, from_entity, to_entity").order("transfer_date", { ascending: false }).limit(10);
  ev.rows(transfers, { label: (t) => `Credit transfer on ${t.transfer_date}` });
}));
