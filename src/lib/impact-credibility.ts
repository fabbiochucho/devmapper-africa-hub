export interface CredibilityInput {
  verificationTier: 'none' | 'self' | 'community' | 'partner' | 'institutional';
  evidenceCount: number;
  carbonDataVerified: boolean;
  reportCompleteness: number; // 0-1
  lastUpdated: Date | string | null;
}

export function calculateCredibilityScore(input: CredibilityInput): number {
  let score = 0;

  // Verification tier (0-100 pts contribution, weighted to max 40)
  const tierPoints: Record<string, number> = {
    none: 0, self: 10, community: 25, partner: 50, institutional: 100
  };
  score += (tierPoints[input.verificationTier] ?? 0) * 0.4;

  // Evidence uploaded (each item = +5pts, max 20pts)
  score += Math.min(input.evidenceCount * 5, 20);

  // Carbon data verified (+15pts)
  if (input.carbonDataVerified) score += 15;

  // Report completeness (% × 10pts max)
  score += Math.min(input.reportCompleteness * 10, 10);

  // Time since last update (>6 months = -10pts)
  if (input.lastUpdated) {
    const lastDate = new Date(input.lastUpdated);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (lastDate < sixMonthsAgo) score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getCredibilityColor(score: number): string {
  if (score <= 40) return 'text-destructive';
  if (score <= 70) return 'text-yellow-600';
  return 'text-green-600';
}

export function getCredibilityBgColor(score: number): string {
  if (score <= 40) return 'bg-destructive/10 text-destructive';
  if (score <= 70) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function getCredibilityLabel(score: number): string {
  if (score <= 40) return 'Low Credibility';
  if (score <= 70) return 'Moderate Credibility';
  return 'High Credibility';
}
