import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";

interface ComplianceScore {
  id: string;
  framework_code: string;
  score_percentage: number;
  total_indicators: number;
  reported_indicators: number;
  gaps: unknown;
  assessed_at: string;
}

const FRAMEWORK_LABELS: Record<string, { name: string; description: string }> = {
  GHG_PROTOCOL: { name: "GHG Protocol", description: "Scope 1, 2, 3 emissions accounting" },
  CDP: { name: "CDP", description: "Climate disclosure questionnaire" },
  ISSB: { name: "ISSB (IFRS S1/S2)", description: "Sustainability disclosure standards" },
  CSRD: { name: "CSRD", description: "EU corporate sustainability reporting" },
  GRI: { name: "GRI Universal 2021", description: "Global Reporting Initiative" },
  TCFD: { name: "TCFD", description: "Climate-related financial disclosures" },
  SBTi: { name: "SBTi", description: "Science Based Targets initiative" },
};

interface Props {
  organizationId: string;
}

export const ComplianceScoresDashboard = ({ organizationId }: Props) => {
  const [scores, setScores] = useState<ComplianceScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("compliance_scores")
        .select("*")
        .eq("organization_id", organizationId)
        .order("score_percentage", { ascending: false });
      setScores((data as ComplianceScore[]) || []);
      setLoading(false);
    };
    load();
  }, [organizationId]);

  const getColor = (score: number) => {
    if (score >= 75) return "bg-primary";
    if (score >= 50) return "bg-accent";
    return "bg-destructive";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Framework Compliance Alignment
        </CardTitle>
        <CardDescription>
          Per-framework % alignment based on reported indicators (GHG Protocol, CDP, ISSB, CSRD, SBTi)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scores.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No compliance assessments yet. Run a framework gap analysis to populate scores.
          </div>
        ) : (
          scores.map((s) => {
            const meta = FRAMEWORK_LABELS[s.framework_code] || {
              name: s.framework_code,
              description: "",
            };
            return (
              <div key={s.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{meta.name}</div>
                    <div className="text-xs text-muted-foreground">{meta.description}</div>
                  </div>
                  <Badge variant="outline">
                    {s.reported_indicators}/{s.total_indicators} indicators
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={Number(s.score_percentage)} className="flex-1" />
                  <span className={`text-sm font-semibold w-12 text-right ${
                    Number(s.score_percentage) >= 75 ? "text-primary" :
                    Number(s.score_percentage) >= 50 ? "text-accent-foreground" : "text-destructive"
                  }`}>
                    {Number(s.score_percentage).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ComplianceScoresDashboard;
