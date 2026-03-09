import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, MessageSquare, Ticket, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalReports: number;
  openTickets: number;
  pendingVerifications: number;
  forumPosts: number;
  unreadBroadcasts: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalReports: 0,
    openTickets: 0,
    pendingVerifications: 0,
    forumPosts: 0,
    unreadBroadcasts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, reportsRes, ticketsRes, forumRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("forum_posts").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalReports: reportsRes.count || 0,
        openTickets: ticketsRes.count || 0,
        pendingVerifications: 0,
        forumPosts: forumRes.count || 0,
        unreadBroadcasts: 0,
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
    { title: "Open Tickets", value: stats.openTickets, icon: Ticket, color: "text-orange-500" },
    { title: "Forum Posts", value: stats.forumPosts, icon: MessageSquare, color: "text-purple-500" },
  ];

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
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Review flagged content</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">3 pending</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Respond to high-priority tickets</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">2 urgent</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Verify new organizations</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">5 awaiting</span>
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
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">New user registration</p>
                <p className="text-xs text-muted-foreground">john@example.com - 5 min ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">New project submitted</p>
                <p className="text-xs text-muted-foreground">Solar Irrigation Project - 12 min ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Support ticket opened</p>
                <p className="text-xs text-muted-foreground">Billing inquiry - 25 min ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
