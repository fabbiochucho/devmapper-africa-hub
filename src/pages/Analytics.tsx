
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SdgDashboardView from "@/components/analytics/SdgDashboardView";
import SdgMapView from "@/components/analytics/SdgMapView";
import { BarChart3, Map, FileText } from "lucide-react";
import ProjectReportsView from "@/components/analytics/ProjectReportsView";

const AnalyticsPage = () => {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
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
        <ProjectReportsView />
      </TabsContent>
    </Tabs>
  );
};

export default AnalyticsPage;

