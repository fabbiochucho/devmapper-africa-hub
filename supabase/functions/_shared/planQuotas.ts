export interface PlanQuotas {
  project_cap: number;
  monthly_addition: number;
  rollover_allowed: boolean;
}

/**
 * Quota defaults per plan tier, applied on upgrade (both Flutterwave and
 * Paystack webhooks) and reused for the refund downgrade path. "advanced"
 * and "pro" have explicit tiers; everything else (lite, and enterprise —
 * a sales-assisted custom plan not sold through self-serve checkout) falls
 * back to the lite defaults.
 */
export function getPlanQuotas(planType: string): PlanQuotas {
  if (planType === "advanced") {
    return { project_cap: 150, monthly_addition: 15, rollover_allowed: true };
  }
  if (planType === "pro") {
    return { project_cap: 40, monthly_addition: 5, rollover_allowed: true };
  }
  return {
    project_cap: 10,
    monthly_addition: 3,
    rollover_allowed: planType !== "lite" && planType !== "free",
  };
}

/** 30 days monthly, 90 quarterly, 365 yearly. */
export function computePlanExpiry(interval: string | undefined): string {
  const days = interval === "yearly" ? 365 : interval === "quarterly" ? 90 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Canonical USD subscription prices, matching src/pages/BillingUpgrade.tsx's
 * planDetails table exactly. create-payment must charge from this table,
 * never from a client-supplied amount - the client only chooses which plan
 * and interval, never how much that costs. "enterprise" is a
 * sales-assisted plan not sold through self-serve checkout (matches
 * getPlanQuotas' comment above) and has no self-serve price.
 */
export function getPlanPrice(planType: string | undefined, interval: string | undefined): number {
  const pick = (monthly: number, quarterly: number, yearly: number) =>
    interval === "yearly" ? yearly : interval === "quarterly" ? quarterly : monthly;
  if (planType === "pro") return pick(49, 129, 490);
  if (planType === "advanced") return pick(149, 399, 1490);
  // Individual / Professional: a personal plan (researchers, journalists, consultants).
  // ponytail: provisional price pending a pricing decision; change here and in BillingUpgrade.tsx.
  if (planType === "individual") return pick(15, 40, 150);
  return 0;
}
