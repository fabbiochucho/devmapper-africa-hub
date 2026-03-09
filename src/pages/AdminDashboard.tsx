import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Flag, CheckCircle, XCircle, AlertTriangle, Heart, DollarSign, TrendingUp, Loader2, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PartnerManagement from "@/components/admin/PartnerManagement";
import BroadcastManager from "@/components/admin/BroadcastManager";
import { TestAccountManager } from "@/components/admin/TestAccountManager";
import { ScholarshipManager } from "@/components/admin/ScholarshipManager";
import { useAdminVerification } from "@/hooks/useAdminVerification";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  organization?: string | null;
  country: string | null;
  createdAt: string;
}

interface FlaggedReport {
  id: string;
  report_id: string;
  report_title: string;
  flagged_by_name: string;
  reason: string;
  created_at: string;
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

// Inline Audit Log Viewer
function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setLogs(data || []); setLogLoading(false); });
  }, []);

  if (logLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No audit logs recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="p-3 border rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {log.actor_type} • {log.target_table || 'system'}
                  {log.target_id && ` • ${log.target_id.slice(0, 8)}…`}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminVerification();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [flaggedReports, setFlaggedReports] = useState<FlaggedReport[]>([]);
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0, pendingVerifications: 0, flaggedContent: 0, resolvedIssues: 0,
    totalCampaigns: 0, totalRaised: 0, activeCampaigns: 0,
  });

  const loadDashboard = useCallback(async () => {
    try {
      const [campaignsRes, totalUsersRes, pendingUsersCountRes, pendingProfilesRes, flagsRes] = await Promise.all([
        supabase.from('fundraising_campaigns').select(`*, public_profiles!fundraising_campaigns_created_by_fkey(full_name)`).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('profiles').select('user_id, full_name, email, organization, country, created_at').eq('is_verified', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('report_flags').select('id, report_id, reason, created_at, status, flagged_by').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;

      const loadedCampaigns = ((campaignsRes.data as any) || []) as FundraisingCampaign[];
      setCampaigns(loadedCampaigns);

      const pending = (pendingProfilesRes.data || []).map((p: any) => ({
        id: p.user_id, name: p.full_name || 'Unnamed', email: p.email || '—',
        organization: p.organization, country: p.country, createdAt: p.created_at,
      }));
      setPendingUsers(pending);

      // Load flagged content with report titles
      const flags = flagsRes.data || [];
      if (flags.length > 0) {
        const reportIds = [...new Set(flags.map((f: any) => f.report_id))];
        const [reportsRes, profilesRes] = await Promise.all([
          supabase.from('reports').select('id, title').in('id', reportIds),
          supabase.from('profiles').select('user_id, full_name').in('user_id', flags.map((f: any) => f.flagged_by)),
        ]);
        const reportMap = new Map((reportsRes.data || []).map((r: any) => [r.id, r.title]));
        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.full_name || 'Unknown']));

        setFlaggedReports(flags.map((f: any) => ({
          id: f.id, report_id: f.report_id, report_title: reportMap.get(f.report_id) || 'Unknown',
          flagged_by_name: profileMap.get(f.flagged_by) || 'Unknown', reason: f.reason,
          created_at: f.created_at, status: f.status,
        })));
      } else {
        setFlaggedReports([]);
      }

      // Count resolved flags
      const { count: resolvedCount } = await supabase.from('report_flags').select('id', { count: 'exact', head: true }).eq('status', 'resolved');

      const totalRaised = loadedCampaigns.reduce((sum, c) => sum + (c.raised_amount || 0), 0);
      const activeCampaigns = loadedCampaigns.filter(c => c.status === 'active').length;

      setAdminStats({
        totalUsers: totalUsersRes.count || 0,
        pendingVerifications: pendingUsersCountRes.count || 0,
        flaggedContent: flags.length,
        resolvedIssues: resolvedCount || 0,
        totalCampaigns: loadedCampaigns.length,
        totalRaised,
        activeCampaigns,
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast.error('Failed to load admin dashboard data');
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleUserVerification = () => navigate('/user-management');

  const handleFlagModeration = async (flagId: string, action: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase.from('report_flags').update({
        status: action, reviewed_by: authUser?.id, reviewed_at: new Date().toISOString()
      }).eq('id', flagId);
      if (error) throw error;
      toast.success(`Flag ${action}`);
      loadDashboard();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update flag');
    }
  };

  const exportReport = async (type: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'users': {
          const { data: users } = await supabase.from('profiles').select('user_id, full_name, email, organization, country, is_verified, created_at').order('created_at', { ascending: false }).limit(1000);
          data = users || [];
          filename = 'user-activity-report.json';
          break;
        }
        case 'projects': {
          const { data: reports } = await supabase.from('reports').select('id, title, sdg_goal, country_code, project_status, cost, beneficiaries, submitted_at').order('submitted_at', { ascending: false }).limit(1000);
          data = reports || [];
          filename = 'project-analytics.json';
          break;
        }
        case 'verifications': {
          const { data: verifications } = await supabase.from('verification_logs').select('*').order('created_at', { ascending: false }).limit(1000);
          data = verifications || [];
          filename = 'verification-report.json';
          break;
        }
        case 'moderation': {
          const { data: flags } = await supabase.from('report_flags').select('*').order('created_at', { ascending: false }).limit(1000);
          data = flags || [];
          filename = 'moderation-log.json';
          break;
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filename} downloaded`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export report');
    }
  };

  if (adminLoading) return <div className="flex items-center justify-center h-full p-4"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!isAdmin) return <div className="flex items-center justify-center h-full p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader><CardContent><p>You do not have permission to view this page.</p></CardContent></Card></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield />Admin Dashboard - {authUser?.user_metadata?.country || "Global"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-primary">{adminStats.totalUsers}</div><div className="text-sm text-muted-foreground">Total Users</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-yellow-500">{adminStats.pendingVerifications}</div><div className="text-sm text-muted-foreground">Pending Verifications</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-destructive">{adminStats.flaggedContent}</div><div className="text-sm text-muted-foreground">Flagged Content</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-500">{adminStats.resolvedIssues}</div><div className="text-sm text-muted-foreground">Resolved Issues</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-blue-500">{adminStats.totalCampaigns}</div><div className="text-sm text-muted-foreground">Total Campaigns</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-600">${adminStats.totalRaised.toLocaleString()}</div><div className="text-sm text-muted-foreground">Total Raised</div></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">User Verification</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Management</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="content">Flagged Content {flaggedReports.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{flaggedReports.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="partners">Partner Management</TabsTrigger>
          <TabsTrigger value="test-accounts">Test Accounts</TabsTrigger>
          <TabsTrigger value="fellowships">Fellowships</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="reports">System Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users />Pending User Verifications</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map(u => (
                  <div key={u.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div><h3 className="font-semibold">{u.name}</h3><p className="text-sm text-muted-foreground">{u.email}</p></div>
                        <div className="flex items-center gap-2">{u.country && <Badge variant="outline">{u.country}</Badge>}</div>
                        {u.organization && <p className="text-sm text-muted-foreground"><strong>Organization:</strong> {u.organization}</p>}
                        <p className="text-xs text-muted-foreground">Created: {new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" onClick={handleUserVerification}><CheckCircle className="mr-2 h-4 w-4" />Review</Button>
                    </div>
                  </div>
                ))}
                {pendingUsers.length === 0 && <div className="text-center py-8 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No pending user verifications</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Heart />Campaign Management</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div><h3 className="font-semibold">{campaign.title}</h3><p className="text-sm text-muted-foreground">By: {campaign.public_profiles?.full_name || 'Anonymous'}</p></div>
                        <div className="flex items-center gap-2">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                          <span className="text-sm text-muted-foreground">{campaign.currency} {campaign.raised_amount.toLocaleString()} / {campaign.target_amount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Created: {new Date(campaign.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline"><TrendingUp className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline"><DollarSign className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && <div className="text-center py-8 text-muted-foreground"><Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No campaigns found</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Flag />Flagged Content</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedReports.map(flag => (
                  <div key={flag.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div><h3 className="font-semibold">{flag.report_title}</h3><p className="text-sm text-muted-foreground">Report ID: {flag.report_id.slice(0, 8)}…</p></div>
                        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive">{flag.reason}</span></div>
                        <p className="text-xs text-muted-foreground">Flagged by {flag.flagged_by_name} • {new Date(flag.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => handleFlagModeration(flag.id, 'resolved')}><CheckCircle className="mr-1 h-4 w-4" />Resolve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleFlagModeration(flag.id, 'dismissed')}><XCircle className="mr-1 h-4 w-4" />Dismiss</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {flaggedReports.length === 0 && <div className="text-center py-8 text-muted-foreground"><Flag className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No flagged content to review</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts"><BroadcastManager /></TabsContent>
        <TabsContent value="partners"><PartnerManagement /></TabsContent>
        <TabsContent value="test-accounts"><TestAccountManager /></TabsContent>
        <TabsContent value="fellowships"><ScholarshipManager /></TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader><CardTitle>System Reports</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'users', title: 'User Activity Report', desc: 'Export user engagement data' },
                  { key: 'projects', title: 'Project Analytics', desc: 'Download project statistics' },
                  { key: 'verifications', title: 'Verification Report', desc: 'Community verification metrics' },
                  { key: 'moderation', title: 'Moderation Log', desc: 'Content moderation history' },
                ].map(report => (
                  <Button key={report.key} variant="outline" className="h-20 flex flex-col items-center justify-center text-center" onClick={() => exportReport(report.key)}>
                    <div className="flex items-center gap-2"><Download className="h-4 w-4" /><span className="font-medium">{report.title}</span></div>
                    <span className="text-sm text-muted-foreground">{report.desc}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
