
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Map, FileText, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import ChangeMakerAnalytics from "@/components/changemaker/ChangeMakerAnalytics";
import LazyChangeMakerMap from "@/components/changemaker/LazyChangeMakerMap";
import ChangeMakerReportsView from "@/components/changemaker/ChangeMakerReportsView";
import ShareableChangeMakerAnalytics from "@/components/changemaker/ShareableChangeMakerAnalytics";

type ChangeMaker = Database['public']['Tables']['change_makers']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Campaign = Database['public']['Tables']['fundraising_campaigns']['Row'];

const ChangeMakerAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const changeMakerId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [changeMakers, setChangeMakers] = useState<ChangeMaker[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cms, error } = await supabase.from('change_makers').select('*');
      if (error) {
        console.error('Failed to load change makers:', error);
        setLoading(false);
        return;
      }

      const list = cms || [];
      setChangeMakers(list);

      // Platform-wide funding/project totals come from real reports and
      // fundraising campaigns tied to each change maker's user_id -- the same
      // join pattern used in ChangeMakerMyAnalytics -- not from a mock
      // impactMetrics object.
      const userIds = list.map(cm => cm.user_id).filter((id): id is string => !!id);
      if (userIds.length > 0) {
        const [{ data: reportsData }, { data: campaignsData }] = await Promise.all([
          supabase.from('reports').select('*').in('user_id', userIds),
          supabase.from('fundraising_campaigns').select('*').in('created_by', userIds),
        ]);
        setReports(reportsData || []);
        setCampaigns(campaignsData || []);
      }
      setLoading(false);
    })();
  }, []);

  const analyticsData = useMemo(() => {
    const totalChangeMakers = changeMakers.length;
    const verifiedChangeMakers = changeMakers.filter(cm => cm.is_verified).length;
    const totalFunding = campaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
    const totalProjects = reports.length;

    return {
      totalChangeMakers,
      totalFunding,
      totalProjects,
      verifiedChangeMakers,
    };
  }, [changeMakers, reports, campaigns]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <ChangeMakerAnalytics changeMakers={changeMakers} reports={reports} campaigns={campaigns} />
        </TabsContent>
        <TabsContent value="map" className="mt-4">
          <LazyChangeMakerMap changeMakers={changeMakers} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ChangeMakerReportsView selectedChangeMakerId={changeMakerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChangeMakerAnalyticsPage;
