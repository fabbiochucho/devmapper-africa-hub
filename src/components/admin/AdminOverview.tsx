import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, MessageSquare, Ticket, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalUsers: number;
  totalReports: number;
  forumPosts: number;
  totalCampaigns: number;
  totalRaised: number;
  pendingVerifications: number;
  changeMakers: number;
  countriesCount: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "report" | "campaign" | "forum";
  title: string;
  timestamp: string;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalReports: 0, forumPosts: 0, totalCampaigns: 0,
    totalRaised: 0, pendingVerifications: 0, changeMakers: 0, countriesCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, reportsRes, forumRes, campaignsRes, pendingRes, cmRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase.from("forum_posts").select("id", { count: "exact", head: true }),
        supabase.from("fundraising_campaigns").select("id, raised_amount, currency, status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", false),
        supabase.from("change_makers").select("id", { count: "exact", head: true }),
      ]);

      const campaigns = campaignsRes.data || [];
      const totalRaised = campaigns.reduce((sum, c: any) => sum + (c.raised_amount || 0), 0);

      // Get recent activity from multiple sources
      const [recentUsers, recentReports, recentPosts] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("reports").select("id, title, submitted_at").order("submitted_at", { ascending: false }).limit(3),
        supabase.from("forum_posts").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const activity: RecentActivity[] = [
        ...(recentUsers.data || []).map((u: any) => ({
          id: u.user_id, type: "user" as const,
          title: `New user: ${u.full_name || 'Anonymous'}`,
          timestamp: u.created_at,
        })),
        ...(recentReports.data || []).map((r: any) => ({
          id: r.id, type: "report" as const,
          title: `Project: ${r.title}`,
          timestamp: r.submitted_at,
        })),
        ...(recentPosts.data || []).map((p: any) => ({
          id: p.id, type: "forum" as const,
          title: `Forum: ${p.title}`,
          timestamp: p.created_at,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

      setRecentActivity(activity);

      setStats({
        totalUsers: usersRes.count || 0,
        totalReports: reportsRes.count || 0,
        forumPosts: forumRes.count || 0,
        totalCampaigns: campaigns.length,
        totalRaised,
        pendingVerifications: pendingRes.count || 0,
        changeMakers: cmRes.count || 0,
        countriesCount: 0,
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Project Reports", value: stats.totalReports, icon: FileText, color: "text-green-500" },
    { title: "Campaigns", value: stats.totalCampaigns, icon: DollarSign, color: "text-orange-500" },
    { title: "Total Raised", value: `$${stats.totalRaised.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500" },
    { title: "Forum Posts", value: stats.forumPosts, icon: MessageSquare, color: "text-purple-500" },
    { title: "Pending Verifications", value: stats.pendingVerifications, icon: Shield, color: "text-yellow-500" },
    { title: "Change Makers", value: stats.changeMakers, icon: CheckCircle, color: "text-primary" },
  ];

  const activityIcon = (type: string) => {
    switch (type) {
      case "user": return <Users className="h-4 w-4 text-blue-500" />;
      case "report": return <FileText className="h-4 w-4 text-green-500" />;
      case "forum": return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "campaign": return <DollarSign className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingVerifications > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Review pending verifications</span>
                <Badge variant="secondary">{stats.pendingVerifications} pending</Badge>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Manage fundraising campaigns</span>
              <Badge variant="outline">{stats.totalCampaigns} total</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Monitor forum activity</span>
              <Badge variant="outline">{stats.forumPosts} posts</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-4">No recent activity</p>
            )}
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="mt-0.5">{activityIcon(a.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
