
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ProjectMap from "@/components/ProjectMap";
import ProjectDetails from "@/components/ProjectDetails";
import { Report } from "@/data/mockReports";
import SdgDistributionChart from "@/components/SdgDistributionChart";
import ProjectStatusChart from "@/components/ProjectStatusChart";

const Analytics = () => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
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
      
      {selectedReport && (
        <ProjectDetails report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <SdgDistributionChart />
        <ProjectStatusChart />
      </div>
    </div>
  );
};

export default Analytics;
