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

/** 30 days for a monthly interval, 365 for yearly — matches existing billing logic. */
export function computePlanExpiry(interval: string | undefined): string {
  const days = interval === "yearly" ? 365 : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
