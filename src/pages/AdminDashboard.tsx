import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Flag, CheckCircle, XCircle, AlertTriangle, Heart, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PartnerManagement from "@/components/admin/PartnerManagement";
import { TestAccountManager } from "@/components/admin/TestAccountManager";
import { ScholarshipManager } from "@/components/admin/ScholarshipManager";
import { useAdminVerification } from "@/hooks/useAdminVerification";

interface PendingUser {
  id: string; // user_id
  name: string;
  email: string;
  organization?: string | null;
  country: string | null;
  createdAt: string;
}

interface FlaggedProject {
  id: number;
  title: string;
  author: string;
  reason: string;
  flaggedBy: string;
  flaggedAt: string;
  status: string;
}

interface FundraisingCampaign {
  id: string;
  title: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  status: string;
  created_at: string;
  created_by: string;
  public_profiles?: { full_name: string | null } | null;
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminVerification();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [flaggedProjects, setFlaggedProjects] = useState<FlaggedProject[]>([]);
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    flaggedContent: 0,
    resolvedIssues: 0,
    totalCampaigns: 0,
    totalRaised: 0,
    activeCampaigns: 0,
  });

  const loadDashboard = useCallback(async () => {
    try {
      const [campaignsRes, totalUsersRes, pendingUsersCountRes, pendingProfilesRes] = await Promise.all([
        supabase
          .from('fundraising_campaigns')
          .select(`*, public_profiles!fundraising_campaigns_created_by_fkey(full_name)`)
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false),
        supabase
          .from('profiles')
          .select('user_id, full_name, email, organization, country, created_at')
          .eq('is_verified', false)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;

      const loadedCampaigns = ((campaignsRes.data as any) || []) as FundraisingCampaign[];
      setCampaigns(loadedCampaigns);

      const pending = (pendingProfilesRes.data || []).map((p: any) => ({
        id: p.user_id,
        name: p.full_name || 'Unnamed',
        email: p.email || '—',
        organization: p.organization,
        country: p.country,
        createdAt: p.created_at,
      }));
      setPendingUsers(pending);

      // NOTE: flagged content + resolved issues require a dedicated moderation workflow/table.
      setFlaggedProjects([]);

      const totalRaised = loadedCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
      const activeCampaigns = loadedCampaigns.filter(c => c.status === 'active').length;

      setAdminStats({
        totalUsers: totalUsersRes.count || 0,
        pendingVerifications: pendingUsersCountRes.count || 0,
        flaggedContent: 0,
        resolvedIssues: 0,
        totalCampaigns: loadedCampaigns.length,
        totalRaised,
        activeCampaigns,
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast.error('Failed to load admin dashboard data');
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleUserVerification = () => {
    // Verification workflow lives in /user-management (full UI + logging)
    navigate('/user-management');
  };

  const handleProjectModeration = (projectId: number, action: "approved" | "removed") => {
    setFlaggedProjects((prevProjects) => prevProjects.filter((p) => p.id !== projectId));
    toast.success(`Project has been ${action}.`);
    setAdminStats(stats => ({ ...stats, flaggedContent: Math.max(0, stats.flaggedContent - 1), resolvedIssues: stats.resolvedIssues + 1 }));
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield />
            Admin Dashboard - {authUser?.user_metadata?.country || "Global"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{adminStats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{adminStats.pendingVerifications}</div>
              <div className="text-sm text-muted-foreground">Pending Verifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{adminStats.flaggedContent}</div>
              <div className="text-sm text-muted-foreground">Flagged Content</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{adminStats.resolvedIssues}</div>
              <div className="text-sm text-muted-foreground">Resolved Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{adminStats.totalCampaigns}</div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${adminStats.totalRaised.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">User Verification</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
          <TabsTrigger value="content">Content Moderation</TabsTrigger>
          <TabsTrigger value="partners">Partner Management</TabsTrigger>
          <TabsTrigger value="test-accounts">Test Accounts</TabsTrigger>
          <TabsTrigger value="fellowships">Fellowships</TabsTrigger>
          <TabsTrigger value="reports">System Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users />
                Pending User Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{u.name}</h3>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.country && <Badge variant="outline">{u.country}</Badge>}
                        </div>
                        {u.organization && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Organization:</strong> {u.organization}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={handleUserVerification}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No pending user verifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart />
                Campaign Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{campaign.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            By: {campaign.public_profiles?.full_name || 'Anonymous'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {campaign.currency} {campaign.raised_amount.toLocaleString()} / {campaign.target_amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline">
                          <TrendingUp className="w-4 h-4" />
                          View Analytics
                        </Button>
                        <Button size="sm" variant="outline">
                          <DollarSign className="w-4 h-4" />
                          View Donations
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No campaigns found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag />
                Flagged Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedProjects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">By: {project.author}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="text-destructive" />
                          <span className="text-sm text-destructive">{project.reason}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Flagged by {project.flaggedBy} • {new Date(project.flaggedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleProjectModeration(project.id, "approved")}
                        >
                          <CheckCircle />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleProjectModeration(project.id, "removed")}
                        >
                          <XCircle />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {flaggedProjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Flag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No flagged content to review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <PartnerManagement />
        </TabsContent>

        <TabsContent value="test-accounts">
          <TestAccountManager />
        </TabsContent>

        <TabsContent value="fellowships">
          <ScholarshipManager />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                    <span className="font-medium">User Activity Report</span>
                    <span className="text-sm text-muted-foreground">Export user engagement data</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                    <span className="font-medium">Project Analytics</span>
                    <span className="text-sm text-muted-foreground">Download project statistics</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                    <span className="font-medium">Verification Report</span>
                    <span className="text-sm text-muted-foreground">Community verification metrics</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                    <span className="font-medium">Moderation Log</span>
                    <span className="text-sm text-muted-foreground">Content moderation history</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
