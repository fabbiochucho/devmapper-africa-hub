
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SdgDashboardView from "@/components/analytics/SdgDashboardView";
import SdgMapView from "@/components/analytics/SdgMapView";
import { BarChart3, Map } from "lucide-react";

const AnalyticsPage = () => {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dashboard">
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="map">
          <Map className="mr-2 h-4 w-4" />
          Map View
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-4">
        <SdgDashboardView />
      </TabsContent>
      <TabsContent value="map" className="mt-4">
        <SdgMapView />
      </TabsContent>
    </Tabs>
  );
};

export default AnalyticsPage;
