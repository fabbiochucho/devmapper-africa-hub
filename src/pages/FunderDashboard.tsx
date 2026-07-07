import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import FundingReadinessBadge from '@/components/scoring/FundingReadinessBadge';
import RiskFlagsList from '@/components/scoring/RiskFlagsList';
import { calculateFundingReadinessScore } from '@/lib/funding-readiness';
import { deriveRiskFlags } from '@/lib/risk-flags';

interface ReportRow {
  id: string;
  title: string;
  cost: number | null;
  is_verified: boolean | null;
  verification_count: number | null;
  end_date: string | null;
  project_financial_impact: {
    roi_percentage: number | null;
    revenue_generated: number | null;
    operational_cost_savings: number | null;
    carbon_credit_value: number | null;
  }[] | null;
  fundraising_campaigns: {
    target_amount: number;
    raised_amount: number;
    deadline: string;
  }[] | null;
}

/**
 * Deterministic, client-computed funding readiness view — sourced from the
 * same tables ndovu-investor-agent already reads (reports.cost,
 * project_financial_impact, fundraising_campaigns). This score is separate
 * from that agent's LLM-driven answer to the same question and the two are
 * not reconciled - a known follow-up, not a bug.
 */
export default function FunderDashboard() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reports')
      .select('id, title, cost, is_verified, verification_count, end_date, project_financial_impact(roi_percentage, revenue_generated, operational_cost_savings, carbon_credit_value), fundraising_campaigns(target_amount, raised_amount, deadline)')
      .order('submitted_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setReports((data as unknown as ReportRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Funder Dashboard - DevMapper" description="Funding readiness scores and risk flags across DevMapper projects." />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" />
          Funder Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Funding readiness and risk signals across projects</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => {
            const financials = report.project_financial_impact?.[0];
            const campaign = report.fundraising_campaigns?.[0];

            const score = calculateFundingReadinessScore({
              reportCost: report.cost,
              roiPercentage: financials?.roi_percentage ?? null,
              revenueGenerated: financials?.revenue_generated ?? null,
              operationalCostSavings: financials?.operational_cost_savings ?? null,
              carbonCreditValue: financials?.carbon_credit_value ?? null,
              fundraisingTargetAmount: campaign?.target_amount ?? null,
              fundraisingRaisedAmount: campaign?.raised_amount ?? null,
              hasVerifiedFinancials: !!financials,
              timelineOnTrack: !campaign?.deadline || new Date(campaign.deadline) > new Date(),
            });

            const flags = deriveRiskFlags({
              hasFinancialData: !!financials,
              reportCost: report.cost,
              verificationStatus: report.is_verified ? 'approved' : 'none',
              evidenceCount: report.verification_count ?? 0,
              deadline: campaign?.deadline ?? report.end_date,
              milestonesTotal: 0,
              milestonesCompleted: 0,
            });

            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <FundingReadinessBadge score={score} />
                  </div>
                  {report.cost != null && (
                    <CardDescription>Cost: ${report.cost.toLocaleString()}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Separator className="mb-3" />
                  <RiskFlagsList flags={flags} />
                </CardContent>
              </Card>
            );
          })}
          {reports.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">No projects to evaluate yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
