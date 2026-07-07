// Clones the shape of src/lib/impact-credibility.ts: a pure, clamped 0-100
// score computed inline from already-fetched data (not persisted), plus
// matching color/label helpers for consistent styling.
//
// TODO(business-logic): weightings below are initial placeholders pending
// review by someone with real fundraising/underwriting diligence
// experience - not validated against real funding outcomes.

export interface FundingReadinessInput {
  reportCost: number | null;
  roiPercentage: number | null;
  revenueGenerated: number | null;
  operationalCostSavings: number | null;
  carbonCreditValue: number | null;
  fundraisingTargetAmount: number | null;
  fundraisingRaisedAmount: number | null;
  hasVerifiedFinancials: boolean;
  timelineOnTrack: boolean;
}

export function calculateFundingReadinessScore(input: FundingReadinessInput): number {
  let score = 0;

  // ROI signal (up to 30pts)
  if (input.roiPercentage != null) {
    score += Math.max(0, Math.min(input.roiPercentage, 30));
  }

  // Financials have been entered and verified at all (+25pts)
  if (input.hasVerifiedFinancials) score += 25;

  // Fundraising traction: raised/target ratio (up to 20pts)
  if (input.fundraisingTargetAmount && input.fundraisingTargetAmount > 0 && input.fundraisingRaisedAmount != null) {
    const ratio = input.fundraisingRaisedAmount / input.fundraisingTargetAmount;
    score += Math.min(ratio, 1) * 20;
  }

  // Revenue/cost-savings/carbon-credit value diversification (up to 15pts)
  const diversificationSignals = [input.revenueGenerated, input.operationalCostSavings, input.carbonCreditValue]
    .filter((v) => v != null && v > 0).length;
  score += Math.min(diversificationSignals * 5, 15);

  // Timeline on track (+10pts)
  if (input.timelineOnTrack) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getFundingReadinessColor(score: number): string {
  if (score <= 40) return 'text-destructive';
  if (score <= 70) return 'text-yellow-600';
  return 'text-green-600';
}

export function getFundingReadinessBgColor(score: number): string {
  if (score <= 40) return 'bg-destructive/10 text-destructive';
  if (score <= 70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function getFundingReadinessLabel(score: number): string {
  if (score <= 40) return 'Low Readiness';
  if (score <= 70) return 'Moderate Readiness';
  return 'High Readiness';
}
