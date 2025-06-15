import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ProjectMap from "@/components/ProjectMap";
import ProjectDetails from "@/components/ProjectDetails";
import { mockReports, Report } from "@/data/mockReports";
import SdgDistributionChart from "@/components/SdgDistributionChart";
import ProjectStatusChart from "@/components/ProjectStatusChart";
import ProjectsByCountryChart from "@/components/ProjectsByCountryChart";
import { DollarSign, BarChart3, CheckCircle2 } from "lucide-react";

const Analytics = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const analyticsData = useMemo(() => {
    const totalProjects = mockReports.length;

    const totalBudgetUSD = mockReports.reduce((acc, report) => {
        if (!report.cost) return acc;
        if (report.costCurrency === 'USD') return acc + report.cost;
        if (report.usd_exchange_rate) return acc + (report.cost / report.usd_exchange_rate);
        return acc;
    }, 0);
    
    const reportsWithScore = mockReports.filter(r => r.verification_score !== undefined);
    const avgVerificationScore = reportsWithScore.length > 0
      ? reportsWithScore.reduce((acc, report) => acc + report.verification_score!, 0) / reportsWithScore.length
      : 0;
      
    return {
      totalProjects,
      totalBudgetUSD,
      avgVerificationScore,
    };
  }, []);


  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
       
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalProjects}</div>
                <p className="text-xs text-muted-foreground">Tracked across the platform</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget (USD)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${analyticsData.totalBudgetUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <p className="text-xs text-muted-foreground">Combined value of all projects</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Verification Score</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.avgVerificationScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Average community trust score</p>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Project Hotspots</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            This map shows a clustered view of projects. Clusters are colored by the most common SDG goal.
          </p>
          <div className="h-[500px] w-full">
            <ProjectMap onMarkerClick={setSelectedReport} />
          </div>
        </CardContent>
      </Card>
      
      <ProjectDetails
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdate={(updatedReport) => {
          // This is a dummy update for the preview. In a real app, this would be a state update.
          const index = mockReports.findIndex(r => r.id === updatedReport.id);
          if (index !== -1) {
              mockReports[index] = updatedReport;
          }
          setSelectedReport(updatedReport);
        }}
      />

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <SdgDistributionChart />
        <ProjectStatusChart />
        <ProjectsByCountryChart />
      </div>
    </div>
  );
};

export default Analytics;
