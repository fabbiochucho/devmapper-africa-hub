// Derived, non-persisted risk detection - mirrors impact-credibility.ts's
// "compute on render from already-fetched data" convention rather than a new
// DB table. Categories are lifted directly from the existing
// ndovu-investor-agent system prompt ("Flag investment risks: unverified
// claims, missing financials, timeline gaps").
//
// Severity rules: missing financials and rejected claims are high (an
// investor can't diligence the project); unverified claims or no evidence
// are medium. Schedule slippage uses the standard schedule-variance idea:
// compare the share of milestones done with the share of the planned
// duration elapsed, and flag a gap of 25+ points (medium) or 50+ (high).

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
  /** Project start; without it, progress can't be compared with elapsed time. */
  startDate?: Date | string | null;
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
    const deadline = new Date(input.deadline).getTime();
    const now = Date.now();
    const hasMilestones = input.milestonesTotal > 0;
    const completionRatio = hasMilestones ? input.milestonesCompleted / input.milestonesTotal : 0;

    if (deadline < now) {
      if (!hasMilestones) {
        flags.push({
          type: 'timeline_gap',
          severity: 'medium',
          message: 'The deadline has passed and no milestones are recorded to show progress.',
        });
      } else if (completionRatio < 1) {
        flags.push({
          type: 'timeline_gap',
          severity: 'high',
          message: 'Deadline has passed with incomplete milestones.',
        });
      }
    } else if (hasMilestones && input.startDate) {
      const start = new Date(input.startDate).getTime();
      const elapsedRatio = deadline > start ? Math.min(1, Math.max(0, (now - start) / (deadline - start))) : 0;
      const gap = elapsedRatio - completionRatio;
      if (gap >= 0.25) {
        flags.push({
          type: 'timeline_gap',
          severity: gap >= 0.5 ? 'high' : 'medium',
          message: `Milestones are behind schedule: ${Math.round(completionRatio * 100)}% done with ${Math.round(elapsedRatio * 100)}% of the time elapsed.`,
        });
      }
    }
  }

  return flags;
}
