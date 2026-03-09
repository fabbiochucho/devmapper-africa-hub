import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Loader2, Globe, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { africanCountries } from "@/data/countries";

interface ExposureResult {
  framework_name: string;
  category: string;
  mandatory: boolean;
  enforcement_risk: string | null;
  reporting_frequency: string | null;
  compliance_status: "compliant" | "partial" | "non_compliant" | "unknown";
  gaps: string[];
}

interface AssessmentResult {
  exposure: ExposureResult[];
  summary: { total: number; mandatory: number; compliance_score: number };
}

interface ComplianceAssessmentProps {
  actorType: "corporate" | "ngo" | "government" | "change_maker";
  countryCode?: string;
  sectorCode?: string;
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  compliant: { bg: "bg-green-500/10", text: "text-green-600", icon: <CheckCircle2 className="h-4 w-4" /> },
  partial: { bg: "bg-orange-500/10", text: "text-orange-600", icon: <AlertTriangle className="h-4 w-4" /> },
  non_compliant: { bg: "bg-destructive/10", text: "text-destructive", icon: <XCircle className="h-4 w-4" /> },
  unknown: { bg: "bg-muted", text: "text-muted-foreground", icon: <Shield className="h-4 w-4" /> },
};

export default function ComplianceAssessment({ actorType, countryCode, sectorCode }: ComplianceAssessmentProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(countryCode || "");

  const runAssessment = async () => {
    if (!selectedCountry) {
      toast.error("Please select a country");
      return;
    }
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ptfrzwsivtetvmdotfui.supabase.co";
      const resp = await fetch(
        `${supabaseUrl}/functions/v1/rule-engine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "assess",
            country_code: selectedCountry,
            actor_type: actorType,
            sector_code: sectorCode || null,
          }),
        }
      );
      if (!resp.ok) throw new Error("Assessment failed");
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to run compliance assessment");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-orange-600";
    return "text-destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Regulatory Compliance Assessment
        </CardTitle>
        <CardDescription>
          Assess your regulatory exposure and compliance gaps across African frameworks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {africanCountries.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />{c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runAssessment} disabled={loading || !selectedCountry}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Run Assessment
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(result.summary.compliance_score)}`}>
                    {result.summary.compliance_score}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Compliance Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{result.summary.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">Applicable Frameworks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-destructive">{result.summary.mandatory}</div>
                  <p className="text-xs text-muted-foreground mt-1">Mandatory</p>
                </CardContent>
              </Card>
            </div>

            <Progress value={result.summary.compliance_score} className="h-2" />

            {/* Framework Details */}
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {result.exposure.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No regulatory frameworks found for this country/actor combination. 
                    Framework data is being expanded — check back soon.
                  </p>
                ) : (
                  result.exposure.map((fw, i) => {
                    const status = statusColors[fw.compliance_status] || statusColors.unknown;
                    return (
                      <Card key={i}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={status.text}>{status.icon}</span>
                                <span className="font-medium text-sm">{fw.framework_name}</span>
                                {fw.mandatory && <Badge variant="destructive" className="text-xs">Mandatory</Badge>}
                                <Badge variant="outline" className="text-xs">{fw.category}</Badge>
                              </div>
                              {fw.reporting_frequency && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <FileText className="h-3 w-3" />Reporting: {fw.reporting_frequency}
                                </p>
                              )}
                              {fw.gaps.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {fw.gaps.map((gap, j) => (
                                    <p key={j} className="text-xs text-destructive flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3 shrink-0" />{gap}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge className={`${status.bg} ${status.text} capitalize`}>
                              {fw.compliance_status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
