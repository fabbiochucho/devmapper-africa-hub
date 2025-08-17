
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SdgDashboardView from "@/components/analytics/SdgDashboardView";
import SdgMapView from "@/components/analytics/SdgMapView";
import { BarChart3, Map, FileText, TrendingUp } from "lucide-react";
import ProjectReportsView from "@/components/analytics/ProjectReportsView";
import ShareableAnalytics from "@/components/analytics/ShareableAnalytics";
import RealTimeAnalytics from "@/components/analytics/RealTimeAnalytics";
import { useSearchParams } from "react-router-dom";

const AnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const projectId = searchParams.get("id");

  return (
    <div className="space-y-6">
      <Tabs defaultValue={tab || "realtime"} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime">
            <TrendingUp className="mr-2 h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        <TabsContent value="realtime" className="mt-4">
          <RealTimeAnalytics />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-4">
          <SdgDashboardView />
        </TabsContent>
        <TabsContent value="map" className="mt-4">
          <SdgMapView />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ProjectReportsView selectedProjectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
