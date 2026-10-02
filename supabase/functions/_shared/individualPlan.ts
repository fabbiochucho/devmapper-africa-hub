// Activates an Individual plan after a verified payment webhook (Paystack or Flutterwave).
import type { Db } from "./db.ts";
import { logAuditEvent } from "./db.ts";
import { computePlanExpiry } from "./planQuotas.ts";

export interface IndividualPayment {
  userId: string;
  interval: string | undefined;
  provider: "paystack" | "flutterwave";
  amount: number;
  currency: string;
  reference: string;
}

/** Returns an error message, or null on success. Renewals extend from the later of now or the current expiry. */
export async function activateIndividualPlan(db: Db, p: IndividualPayment): Promise<string | null> {
  const { data: user } = await db.auth.admin.getUserById(p.userId);
  if (!user?.user) return `User not found: ${p.userId}`;

  const { data: current } = await db.from("user_plans").select("expires_at").eq("user_id", p.userId).maybeSingle();
  const base = current && new Date(current.expires_at).getTime() > Date.now() ? new Date(current.expires_at).getTime() : Date.now();
  const expiresAt = new Date(base + (new Date(computePlanExpiry(p.interval)).getTime() - Date.now())).toISOString();

  const { error } = await db.from("user_plans").upsert({
    user_id: p.userId, plan: "individual", started_at: new Date().toISOString(), expires_at: expiresAt, source: p.provider, updated_at: new Date().toISOString(),
  });
  if (error) return `Plan update failed: ${error.message}`;

  await logAuditEvent(db, {
    p_actor_id: null, p_actor_type: "webhook", p_org_id: null, p_action: "individual_plan_activated",
    p_target_table: "user_plans", p_target_id: p.userId,
    p_payload: { amount: p.amount, currency: p.currency, transaction_id: p.reference, provider: p.provider, expires_at: expiresAt },
  });
  await db.from("billing_events").insert({
    user_id: p.userId, event_type: "payment_success", new_plan: "individual", provider: p.provider,
    amount: p.amount, currency: p.currency, external_id: p.reference,
  });
  return null;
}
