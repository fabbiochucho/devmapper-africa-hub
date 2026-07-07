// Derived, non-persisted risk detection - mirrors impact-credibility.ts's
// "compute on render from already-fetched data" convention rather than a new
// DB table. Categories are lifted directly from the existing
// ndovu-investor-agent system prompt ("Flag investment risks: unverified
// claims, missing financials, timeline gaps").
//
// TODO(business-logic): severity thresholds are initial placeholders
// pending review by someone with real fundraising-diligence experience.

export type RiskFlagType = 'missing_financials' | 'unverified_claims' | 'timeline_gap';
export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskFlag {
  type: RiskFlagType;
  severity: RiskSeverity;
  message: string;
}

export interface RiskFlagInput {
  hasFinancialData: boolean;
  reportCost: number | null;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  evidenceCount: number;
  deadline: Date | string | null;
  milestonesTotal: number;
  milestonesCompleted: number;
}

export function deriveRiskFlags(input: RiskFlagInput): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (!input.hasFinancialData || input.reportCost == null) {
    flags.push({
      type: 'missing_financials',
      severity: 'high',
      message: 'No cost/financial data has been entered for this project.',
    });
  }

  if (input.verificationStatus === 'none' || input.verificationStatus === 'rejected') {
    flags.push({
      type: 'unverified_claims',
      severity: input.verificationStatus === 'rejected' ? 'high' : 'medium',
      message: input.verificationStatus === 'rejected'
        ? 'This project\'s claims were rejected by a verifier.'
        : 'This project has not been verified by anyone.',
    });
  } else if (input.evidenceCount === 0) {
    flags.push({
      type: 'unverified_claims',
      severity: 'medium',
      message: 'No supporting evidence has been uploaded.',
    });
  }

  if (input.deadline) {
    const deadlineDate = new Date(input.deadline);
    const isPastDue = deadlineDate.getTime() < Date.now();
    const completionRatio = input.milestonesTotal > 0 ? input.milestonesCompleted / input.milestonesTotal : 0;

    if (isPastDue && completionRatio < 1) {
      flags.push({
        type: 'timeline_gap',
        severity: 'high',
        message: 'Deadline has passed with incomplete milestones.',
      });
    } else if (input.milestonesTotal > 0 && completionRatio < 0.3) {
      flags.push({
        type: 'timeline_gap',
        severity: 'low',
        message: 'Milestone completion is significantly behind schedule.',
      });
    }
  }

  return flags;
}
