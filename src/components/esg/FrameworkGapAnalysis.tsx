import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, AlertTriangle, CheckCircle, ExternalLink, Globe, Shield, BookOpen } from "lucide-react";
import { ESG_FRAMEWORKS, analyzeFrameworkGaps, type Framework, type FrameworkGapResult } from "@/lib/esg-frameworks";

interface FrameworkGapAnalysisProps {
  availableData?: {
    hasEmissions: boolean;
    hasScope1: boolean;
    hasScope2: boolean;
    hasScope3: boolean;
    hasGovernance: boolean;
    hasTargets: boolean;
    hasBiodiversity: boolean;
    hasWater: boolean;
    hasWaste: boolean;
    hasSuppliers: boolean;
    hasSocialMetrics: boolean;
  };
}

const defaultData = {
  hasEmissions: false, hasScope1: false, hasScope2: false, hasScope3: false,
  hasGovernance: false, hasTargets: false, hasBiodiversity: false,
  hasWater: false, hasWaste: false, hasSuppliers: false, hasSocialMetrics: false,
};

export default function FrameworkGapAnalysis({ availableData = defaultData }: FrameworkGapAnalysisProps) {
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  const filteredFrameworks = useMemo(() => {
    if (jurisdictionFilter === "all") return ESG_FRAMEWORKS;
    return ESG_FRAMEWORKS.filter(f => f.jurisdiction === jurisdictionFilter || f.jurisdiction === "Global");
  }, [jurisdictionFilter]);

  const gapResults = useMemo(() => {
    return filteredFrameworks.map(f => analyzeFrameworkGaps(f.id, availableData)).filter(Boolean) as FrameworkGapResult[];
  }, [filteredFrameworks, availableData]);

  const selectedGap = selectedFramework
    ? gapResults.find(g => g.framework.id === selectedFramework)
    : null;

  const jurisdictions = [...new Set(ESG_FRAMEWORKS.map(f => f.jurisdiction))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            ESG Framework Gap Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            {ESG_FRAMEWORKS.length} frameworks • Automated compliance tracking
          </p>
        </div>
        <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
          <SelectTrigger className="w-[180px]"><Globe className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jurisdictions</SelectItem>
            {jurisdictions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Framework Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gapResults.map(result => {
          const compliance = 100 - result.gapPercentage;
          return (
            <Card
              key={result.framework.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${selectedFramework === result.framework.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedFramework(selectedFramework === result.framework.id ? null : result.framework.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{result.framework.shortName}</CardTitle>
                  <div className="flex gap-1">
                    {result.framework.mandatory && <Badge variant="destructive" className="text-xs">Mandatory</Badge>}
                    <Badge variant="outline" className="text-xs">{result.framework.jurisdiction}</Badge>
                  </div>
                </div>
                <CardDescription className="text-xs line-clamp-2">{result.framework.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compliance</span>
                    <span className="font-bold">{compliance.toFixed(0)}%</span>
                  </div>
                  <Progress value={compliance} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{result.metRequirements} of {result.totalRequirements} met</span>
                    <span>{result.gaps.length} gap areas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Framework Detail */}
      {selectedGap && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedGap.framework.name}</CardTitle>
                <CardDescription>{selectedGap.framework.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={selectedGap.framework.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />Website
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedGap.framework.categories.map(cat => {
              const gap = selectedGap.gaps.find(g => g.category === cat.name);
              const metCount = cat.requirements.length - (gap?.missing.length || 0);
              const allMet = !gap || gap.missing.length === 0;

              return (
                <div key={cat.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      {allMet ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      {cat.name}
                    </h4>
                    <Badge variant={allMet ? "default" : "secondary"}>{metCount}/{cat.requirements.length}</Badge>
                  </div>
                  {gap && gap.missing.length > 0 && (
                    <ul className="space-y-1 ml-6">
                      {gap.missing.map((m, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />{m}
                        </li>
                      ))}
                    </ul>
                  )}
                  {allMet && (
                    <p className="text-sm text-green-600 ml-6">All requirements met ✓</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
