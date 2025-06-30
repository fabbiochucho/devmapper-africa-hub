
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Map, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { mockChangeMakers } from "@/data/mockChangeMakers";
import { useMemo } from "react";
import ChangeMakerAnalytics from "@/components/changemaker/ChangeMakerAnalytics";
import ChangeMakerMap from "@/components/changemaker/ChangeMakerMap";
import ChangeMakerReportsView from "@/components/changemaker/ChangeMakerReportsView";
import ShareableChangeMakerAnalytics from "@/components/changemaker/ShareableChangeMakerAnalytics";

const ChangeMakerAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const changeMakerId = searchParams.get("id");

  const analyticsData = useMemo(() => {
    const totalChangeMakers = mockChangeMakers.length;
    const totalFunding = mockChangeMakers.reduce((sum, cm) => sum + cm.totalFunding, 0);
    const totalLivesTouched = mockChangeMakers.reduce((sum, cm) => sum + cm.impactMetrics.livesTouched, 0);
    const totalProjects = mockChangeMakers.reduce((sum, cm) => sum + cm.impactMetrics.projectsCompleted, 0);
    const verifiedChangeMakers = mockChangeMakers.filter(cm => cm.verified).length;
    
    return {
      totalChangeMakers,
      totalFunding,
      totalLivesTouched,
      totalProjects,
      verifiedChangeMakers
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Change Maker Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into change makers driving sustainable development
        </p>
      </div>
      
      <ShareableChangeMakerAnalytics data={analyticsData} />
      
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
          <ChangeMakerAnalytics changeMakers={mockChangeMakers} />
        </TabsContent>
        <TabsContent value="map" className="mt-4">
          <ChangeMakerMap changeMakers={mockChangeMakers} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ChangeMakerReportsView selectedChangeMakerId={changeMakerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChangeMakerAnalyticsPage;
