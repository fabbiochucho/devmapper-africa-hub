// deno-lint-ignore-file no-explicit-any

import { getPlanQuotas } from "./planQuotas.ts";

export interface RefundDowngradeParams {
  organizationId: string;
  provider: "flutterwave" | "paystack";
  amount?: number | null;
  currency?: string | null;
  externalId?: string | null;
}

export interface RefundDowngradeResult {
  success: boolean;
  reason?: "organization_not_found" | "already_lite" | "update_failed";
}

/**
 * Downgrades an organization to the lite plan in response to a refund,
 * records the billing/audit trail, and notifies org admins by email.
 * Shared by the Flutterwave and Paystack webhook handlers so both providers
 * downgrade identically.
 */
export async function downgradeOrganizationForRefund(
  supabase: any,
  params: RefundDowngradeParams,
): Promise<RefundDowngradeResult> {
  const { organizationId, provider, amount, currency, externalId } = params;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, plan_type")
    .eq("id", organizationId)
    .single();

  if (orgError || !org) {
    console.error("[planDowngrade] Organization not found:", organizationId);
    return { success: false, reason: "organization_not_found" };
  }

  if (org.plan_type === "lite") {
    console.log("[planDowngrade] Organization already on lite plan, skipping:", organizationId);
    return { success: true, reason: "already_lite" };
  }

  const oldPlan = org.plan_type;

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      plan_type: "lite",
      ...getPlanQuotas("lite"),
      plan_expires_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (updateError) {
    console.error("[planDowngrade] Failed to downgrade organization:", updateError);
    return { success: false, reason: "update_failed" };
  }

  const { error: billingError } = await supabase.from("billing_events").insert([{
    organization_id: organizationId,
    event_type: "refund",
    old_plan: oldPlan,
    new_plan: "lite",
    provider,
    amount: amount ?? null,
    currency: currency ?? "USD",
    external_id: externalId ?? null,
  }]);

  if (billingError) {
    console.error("[planDowngrade] Failed to log billing event:", billingError);
  }

  await supabase.rpc("log_audit_event", {
    p_actor_id: null,
    p_actor_type: "webhook",
    p_org_id: organizationId,
    p_action: "plan_downgraded_refund",
    p_target_table: "organizations",
    p_target_id: organizationId,
    p_payload: { old_plan: oldPlan, new_plan: "lite", provider, external_id: externalId },
  });

  await notifyDowngrade(organizationId);

  console.log(`[planDowngrade] Downgraded organization ${organizationId} from ${oldPlan} to lite (refund via ${provider})`);
  return { success: true };
}

async function notifyDowngrade(organizationId: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) return;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-downgrade-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationId }),
    });

    if (!response.ok) {
      console.error("[planDowngrade] send-downgrade-email failed:", await response.text());
    }
  } catch (error) {
    // Never let a notification failure fail the webhook itself.
    console.error("[planDowngrade] Failed to trigger downgrade email:", error);
  }
}
