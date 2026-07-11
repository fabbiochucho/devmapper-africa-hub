import { carbonProjectTypes } from '@/lib/constants';

export interface PortfolioHoldingInput {
  projectType: string | null;
  quantity: number;
  status: string;
}

export interface ProjectTypeShare {
  type: string;
  label: string;
  tonnes: number;
  share: number;
}

export type ConcentrationRisk = 'low' | 'moderate' | 'high';

export interface DiversificationAnalysis {
  breakdown: ProjectTypeShare[];
  herfindahlIndex: number;
  concentrationRisk: ConcentrationRisk;
  dominantType: ProjectTypeShare | null;
  unrepresentedTypes: string[];
  suggestion: string;
}

// Standard antitrust-style thresholds (HHI on a 0-1 fractional-share scale,
// i.e. sum of squared shares) rather than the more common 0-10,000 scale.
const HHI_MODERATE_THRESHOLD = 0.25;
const HHI_HIGH_THRESHOLD = 0.5;

function labelFor(type: string): string {
  return carbonProjectTypes.find((t) => t.value === type)?.label ?? type;
}

/**
 * Computes project-type concentration risk for a portfolio's holdings using
 * the Herfindahl-Hirschman Index, and suggests a rebalancing direction.
 * Sold holdings are excluded (no longer part of the portfolio's exposure);
 * retired/held/transferred all still count since the credit's impact
 * profile still belongs to this portfolio's mix.
 */
export function analyzePortfolioDiversification(holdings: PortfolioHoldingInput[]): DiversificationAnalysis {
  const active = holdings.filter((h) => h.status !== 'sold');
  const totalTonnes = active.reduce((sum, h) => sum + (h.quantity || 0), 0);

  const tonnesByType = new Map<string, number>();
  for (const h of active) {
    const type = h.projectType || 'other';
    tonnesByType.set(type, (tonnesByType.get(type) || 0) + (h.quantity || 0));
  }

  const breakdown: ProjectTypeShare[] = Array.from(tonnesByType.entries())
    .map(([type, tonnes]) => ({
      type,
      label: labelFor(type),
      tonnes,
      share: totalTonnes > 0 ? tonnes / totalTonnes : 0,
    }))
    .sort((a, b) => b.share - a.share);

  const herfindahlIndex = breakdown.reduce((sum, b) => sum + b.share * b.share, 0);

  const concentrationRisk: ConcentrationRisk =
    totalTonnes === 0
      ? 'low'
      : herfindahlIndex >= HHI_HIGH_THRESHOLD
        ? 'high'
        : herfindahlIndex >= HHI_MODERATE_THRESHOLD
          ? 'moderate'
          : 'low';

  const dominantType = breakdown[0] ?? null;

  const heldTypes = new Set(breakdown.map((b) => b.type));
  const unrepresentedTypes = carbonProjectTypes.map((t) => t.value).filter((v) => !heldTypes.has(v));

  let suggestion: string;
  if (totalTonnes === 0) {
    suggestion = 'No holdings yet - purchase credits to start building a diversified portfolio.';
  } else if (concentrationRisk === 'high' && dominantType) {
    const alternatives = unrepresentedTypes.slice(0, 2).map(labelFor).join(' or ');
    suggestion = `${Math.round(dominantType.share * 100)}% of this portfolio is concentrated in ${dominantType.label}. Consider adding credits from ${alternatives || 'other project types'} to reduce concentration risk.`;
  } else if (concentrationRisk === 'moderate' && dominantType) {
    suggestion = `${dominantType.label} makes up ${Math.round(dominantType.share * 100)}% of this portfolio. Diversifying further into other project types would reduce concentration risk.`;
  } else {
    suggestion = 'This portfolio is well-diversified across project types.';
  }

  return { breakdown, herfindahlIndex, concentrationRisk, dominantType, unrepresentedTypes, suggestion };
}
