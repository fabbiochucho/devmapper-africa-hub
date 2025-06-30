
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SdgDashboardView from "@/components/analytics/SdgDashboardView";
import SdgMapView from "@/components/analytics/SdgMapView";
import { BarChart3, Map, FileText } from "lucide-react";
import ProjectReportsView from "@/components/analytics/ProjectReportsView";
import ShareableAnalytics from "@/components/analytics/ShareableAnalytics";
import { useSearchParams } from "react-router-dom";
import { mockReports } from "@/data/mockReports";
import { useMemo } from "react";

const AnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const projectId = searchParams.get("id");

  const analyticsData = useMemo(() => {
    const totalProjects = mockReports.length;
    const countriesCount = new Set(mockReports.map(r => r.country_code)).size;
    const sdgCount = new Set(mockReports.map(r => r.sdg_goal)).size;
    const completedProjects = mockReports.filter(r => r.project_status === 'completed').length;
    const verifiedProjects = mockReports.filter(r => r.verifications && r.verifications.length > 0).length;
    
    return {
      totalProjects,
      countriesCount,
      sdgCount,
      completedProjects,
      verifiedProjects
    };
  }, []);

  return (
    <div className="space-y-6">
      <ShareableAnalytics data={analyticsData} />
      
      <Tabs defaultValue={tab || "dashboard"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
