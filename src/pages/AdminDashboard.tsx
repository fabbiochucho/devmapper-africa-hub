import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Flag, CheckCircle, XCircle, AlertTriangle, Heart, Loader2, Download, Award, Plug } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PartnerManagement from "@/components/admin/PartnerManagement";
import BroadcastManager from "@/components/admin/BroadcastManager";
import { TestAccountManager } from "@/components/admin/TestAccountManager";
import { ScholarshipManager } from "@/components/admin/ScholarshipManager";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import PlatformHealthDashboard from "@/components/admin/PlatformHealthDashboard";

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
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setLogs(data || []); setLogLoading(false); });
  }, []);

  if (logLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>{t('admin.auditLogTitle')}</CardTitle></CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('admin.auditLogEmpty')}</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="p-3 border rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {log.actor_type} • {log.target_table || t('admin.auditLogSystemFallback')}
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

// Inline Data Providers Panel - surfaces the data_providers registry
// (built earlier this session) and the health-tracking columns
// (record_provider_health, wired into every connector) that previously
// had no UI at all - the only way to see them was a direct DB query.
function DataProvidersPanel() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('data_providers').select('*').order('category').order('name')
      .then(({ data }) => { setProviders(data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const statusBadge = (status: string) => {
    if (status === 'active') return <Badge className="bg-green-600 text-white">{t('admin.dataProviders.statusActive')}</Badge>;
    if (status === 'needs_setup') return <Badge variant="outline" className="text-amber-600 border-amber-400">{t('admin.dataProviders.statusNeedsSetup')}</Badge>;
    if (status === 'planned') return <Badge variant="secondary">{t('admin.dataProviders.statusPlanned')}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.dataProviders.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('admin.dataProviders.empty')}</p>
        ) : (
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.name}</span>
                    <Badge variant="outline" className="text-xs">{p.category}</Badge>
                    {statusBadge(p.status)}
                    {p.fallback_strategy === 'internal_estimate' && (
                      <Badge variant="outline" className="text-xs">{t('admin.dataProviders.fallsBackToEstimate')}</Badge>
                    )}
                    {p.consecutive_failures > 0 && (
                      <Badge variant="destructive" className="text-xs">{t('admin.dataProviders.consecutiveFailures', { count: p.consecutive_failures })}</Badge>
                    )}
                  </div>
                  {p.requires_api_key && (
                    <span className="text-xs text-muted-foreground">{t('admin.dataProviders.requiresApiKey')}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{t('admin.dataProviders.lastSuccess', { value: p.last_success_at ? new Date(p.last_success_at).toLocaleString() : t('admin.dataProviders.never') })}</span>
                  <span>{t('admin.dataProviders.lastError', { value: p.last_error_at ? new Date(p.last_error_at).toLocaleString() : t('admin.dataProviders.never') })}</span>
                </div>
                {p.last_error_message && (
                  <p className="text-xs text-destructive mt-1">{p.last_error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline Certification Review Panel - approving here is now the only
// legitimate path a status can move away from 'submitted' (RLS blocks
// applicants from setting anything but 'submitted'/'withdrawn' themselves).
function CertificationReviewPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    const { data, error } = await supabase
      .from('certification_applications')
      .select('id, requested_tier, status, project_description, budget_usd, geographic_scope, evidence_summary, applicant_id, submitted_at')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true });
    if (error) { console.error(error); toast.error(t('admin.certification.loadError')); }
    setApps(data || []);
    setLoading(false);
  }, [t]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setActingId(id);
    try {
      const { error } = await supabase.from('certification_applications').update({
        status, reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      toast.success(`Application ${status}`);
      loadApps();
    } catch (e) {
      console.error(e);
      toast.error(t('admin.certification.updateError'));
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Award />{t('admin.certification.title')}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apps.map(app => (
            <div key={app.id} className="border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold capitalize">{t('admin.certification.tierLabel', { tier: app.requested_tier })}</h3>
                    <Badge variant="outline">{app.geographic_scope || t('admin.certification.unspecifiedScope')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{app.project_description}</p>
                  {app.budget_usd != null && <p className="text-sm text-muted-foreground"><strong>{t('admin.certification.budgetLabel')}</strong> ${Number(app.budget_usd).toLocaleString()}</p>}
                  {app.evidence_summary && <p className="text-sm text-muted-foreground"><strong>{t('admin.certification.evidenceLabel')}</strong> {app.evidence_summary}</p>}
                  <p className="text-xs text-muted-foreground">{t('admin.certification.submittedOn', { date: new Date(app.submitted_at).toLocaleDateString() })}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" disabled={actingId === app.id} onClick={() => handleReview(app.id, 'approved')}><CheckCircle className="mr-1 h-4 w-4" />{t('admin.certification.approveButton')}</Button>
                  <Button size="sm" variant="destructive" disabled={actingId === app.id} onClick={() => handleReview(app.id, 'rejected')}><XCircle className="mr-1 h-4 w-4" />{t('admin.certification.rejectButton')}</Button>
                </div>
              </div>
            </div>
          ))}
          {apps.length === 0 && <div className="text-center py-8 text-muted-foreground"><Award className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>{t('admin.certification.empty')}</p></div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
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
        supabase.from('fundraising_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('profiles').select('user_id, full_name, email, organization, country, created_at').eq('is_verified', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('report_flags').select('id, report_id, reason, created_at, status, flagged_by').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;

      const rawCampaigns = (campaignsRes.data as any[]) || [];
      // Creator names fetched separately from public_profiles - this used
      // to be a PostgREST embed (public_profiles!fkey(...)), but that
      // relied on public_profiles being a view with special auth.users
      // relationship inference that a plain synced table doesn't get.
      const creatorIds = [...new Set(rawCampaigns.map(c => c.created_by).filter(Boolean))];
      const { data: creatorProfiles } = creatorIds.length
        ? await supabase.from('public_profiles').select('user_id, full_name').in('user_id', creatorIds)
        : { data: [] as { user_id: string; full_name: string | null }[] };
      const creatorNameById = new Map((creatorProfiles || []).map(p => [p.user_id, p.full_name]));

      const loadedCampaigns = rawCampaigns.map(c => ({
        ...c,
        public_profiles: { full_name: creatorNameById.get(c.created_by) || null },
      })) as FundraisingCampaign[];
      setCampaigns(loadedCampaigns);

      const pending = (pendingProfilesRes.data || []).map((p: any) => ({
        id: p.user_id, name: p.full_name || t('admin.dashboard.unnamedFallback'), email: p.email || '—',
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
        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.full_name || t('admin.dashboard.unknownFallback')]));

        setFlaggedReports(flags.map((f: any) => ({
          id: f.id, report_id: f.report_id, report_title: reportMap.get(f.report_id) || t('admin.dashboard.unknownFallback'),
          flagged_by_name: profileMap.get(f.flagged_by) || t('admin.dashboard.unknownFallback'), reason: f.reason,
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
      toast.error(t('admin.dashboard.loadError'));
    }
  }, [t]);

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
      toast.error(t('admin.dashboard.flagUpdateError'));
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const exportReport = async (type: string, format: 'json' | 'csv' = 'json') => {
    try {
      let data: any[] = [];
      let baseName = '';

      switch (type) {
        case 'users': {
          const { data: users } = await supabase.from('profiles').select('user_id, full_name, email, organization, country, is_verified, created_at').order('created_at', { ascending: false }).limit(1000);
          data = users || [];
          baseName = 'user-activity-report';
          break;
        }
        case 'projects': {
          const { data: reports } = await supabase.from('reports').select('id, title, sdg_goal, country_code, project_status, cost, beneficiaries, submitted_at').order('submitted_at', { ascending: false }).limit(1000);
          data = reports || [];
          baseName = 'project-analytics';
          break;
        }
        case 'verifications': {
          const { data: verifications } = await supabase.from('verification_logs').select('*').order('created_at', { ascending: false }).limit(1000);
          data = verifications || [];
          baseName = 'verification-report';
          break;
        }
        case 'moderation': {
          const { data: flags } = await supabase.from('report_flags').select('*').order('created_at', { ascending: false }).limit(1000);
          data = flags || [];
          baseName = 'moderation-log';
          break;
        }
      }

      const isCSV = format === 'csv';
      const content = isCSV ? convertToCSV(data) : JSON.stringify(data, null, 2);
      const mimeType = isCSV ? 'text/csv' : 'application/json';
      const filename = `${baseName}.${isCSV ? 'csv' : 'json'}`;

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(t('admin.dashboard.exportDownloaded', { filename }));
    } catch (e) {
      console.error(e);
      toast.error(t('admin.dashboard.exportError'));
    }
  };

  const handleCampaignVerification = async (campaignId: string, verified: boolean) => {
    try {
      const { error } = await supabase.from('fundraising_campaigns').update({ is_verified: verified }).eq('id', campaignId);
      if (error) throw error;
      toast.success(verified ? t('admin.dashboard.campaignVerified') : t('admin.dashboard.campaignUnverified'));
      loadDashboard();
    } catch (e) {
      console.error(e);
      toast.error(t('admin.dashboard.campaignUpdateError'));
    }
  };

  if (adminLoading) return <div className="flex items-center justify-center h-full p-4"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!isAdmin) return <div className="flex items-center justify-center h-full p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>{t('admin.dashboard.accessDeniedTitle')}</CardTitle></CardHeader><CardContent><p>{t('admin.dashboard.accessDeniedMessage')}</p></CardContent></Card></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield />{t('admin.dashboard.title', { country: authUser?.user_metadata?.country || t('admin.dashboard.globalFallback') })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center"><div className="text-2xl font-bold text-primary">{adminStats.totalUsers}</div><div className="text-sm text-muted-foreground">{t('admin.dashboard.statTotalUsers')}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-yellow-500">{adminStats.pendingVerifications}</div><div className="text-sm text-muted-foreground">{t('admin.dashboard.statPendingVerifications')}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-destructive">{adminStats.flaggedContent}</div><div className="text-sm text-muted-foreground">{t('admin.dashboard.statFlaggedContent')}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-500">{adminStats.resolvedIssues}</div><div className="text-sm text-muted-foreground">{t('admin.dashboard.statResolvedIssues')}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-blue-500">{adminStats.totalCampaigns}</div><div className="text-sm text-muted-foreground">{t('admin.dashboard.statTotalCampaigns')}</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-green-600">${adminStats.totalRaised.toLocaleString()}</div><div className="text-sm text-muted-foreground">{t('admin.dashboard.statTotalRaised')}</div></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="platform-health" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="platform-health">{t('admin.dashboard.tabPlatformHealth')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.dashboard.tabUserVerification')}</TabsTrigger>
          <TabsTrigger value="campaigns">{t('admin.dashboard.tabCampaignManagement')}</TabsTrigger>
          <TabsTrigger value="broadcasts">{t('admin.dashboard.tabBroadcasts')}</TabsTrigger>
          <TabsTrigger value="content">{t('admin.dashboard.tabFlaggedContent')} {flaggedReports.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{flaggedReports.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="certifications">{t('admin.dashboard.tabCertificationReview')}</TabsTrigger>
          <TabsTrigger value="partners">{t('admin.dashboard.tabPartnerManagement')}</TabsTrigger>
          <TabsTrigger value="test-accounts">{t('admin.dashboard.tabTestAccounts')}</TabsTrigger>
          <TabsTrigger value="fellowships">{t('admin.dashboard.tabFellowships')}</TabsTrigger>
          <TabsTrigger value="audit">{t('admin.dashboard.tabAuditLog')}</TabsTrigger>
          <TabsTrigger value="data-providers"><Plug className="w-3.5 h-3.5 mr-1" />{t('admin.dashboard.tabDataProviders')}</TabsTrigger>
          <TabsTrigger value="reports">{t('admin.dashboard.tabSystemReports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="platform-health">
          <PlatformHealthDashboard />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users />{t('admin.dashboard.pendingUserVerificationsTitle')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map(u => (
                  <div key={u.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div><h3 className="font-semibold">{u.name}</h3><p className="text-sm text-muted-foreground">{u.email}</p></div>
                        <div className="flex items-center gap-2">{u.country && <Badge variant="outline">{u.country}</Badge>}</div>
                        {u.organization && <p className="text-sm text-muted-foreground"><strong>{t('admin.dashboard.organizationLabel')}</strong> {u.organization}</p>}
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.createdOn', { date: new Date(u.createdAt).toLocaleDateString() })}</p>
                      </div>
                      <Button size="sm" onClick={handleUserVerification}><CheckCircle className="mr-2 h-4 w-4" />{t('admin.dashboard.reviewButton')}</Button>
                    </div>
                  </div>
                ))}
                {pendingUsers.length === 0 && <div className="text-center py-8 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>{t('admin.dashboard.noPendingUserVerifications')}</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Heart />{t('admin.dashboard.campaignManagementTitle')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{campaign.title}</h3>
                          {(campaign as any).is_verified && <Badge variant="default" className="text-xs">✔ {t('admin.dashboard.verifiedBadge')}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{t('admin.dashboard.byAuthor', { name: campaign.public_profiles?.full_name || t('admin.dashboard.anonymousFallback') })}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                          <span className="text-sm text-muted-foreground">{campaign.currency} {campaign.raised_amount.toLocaleString()} / {campaign.target_amount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.createdOn', { date: new Date(campaign.created_at).toLocaleDateString() })}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant={(campaign as any).is_verified ? "outline" : "default"}
                          onClick={() => handleCampaignVerification(campaign.id, !(campaign as any).is_verified)}>
                          <CheckCircle className="mr-1 h-4 w-4" />{(campaign as any).is_verified ? t('admin.dashboard.unverifyButton') : t('admin.dashboard.verifyButton')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && <div className="text-center py-8 text-muted-foreground"><Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>{t('admin.dashboard.noCampaignsFound')}</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Flag />{t('admin.dashboard.flaggedContentTitle')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedReports.map(flag => (
                  <div key={flag.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div><h3 className="font-semibold">{flag.report_title}</h3><p className="text-sm text-muted-foreground">{t('admin.dashboard.reportIdLabel', { id: flag.report_id.slice(0, 8) })}</p></div>
                        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive">{flag.reason}</span></div>
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.flaggedByOn', { name: flag.flagged_by_name, date: new Date(flag.created_at).toLocaleDateString() })}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => handleFlagModeration(flag.id, 'resolved')}><CheckCircle className="mr-1 h-4 w-4" />{t('admin.dashboard.resolveButton')}</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleFlagModeration(flag.id, 'dismissed')}><XCircle className="mr-1 h-4 w-4" />{t('admin.dashboard.dismissButton')}</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {flaggedReports.length === 0 && <div className="text-center py-8 text-muted-foreground"><Flag className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>{t('admin.dashboard.noFlaggedContent')}</p></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <CertificationReviewPanel />
        </TabsContent>

        <TabsContent value="broadcasts"><BroadcastManager /></TabsContent>
        <TabsContent value="partners"><PartnerManagement /></TabsContent>
        <TabsContent value="test-accounts"><TestAccountManager /></TabsContent>
        <TabsContent value="fellowships"><ScholarshipManager /></TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="data-providers">
          <DataProvidersPanel />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader><CardTitle>{t('admin.dashboard.systemReportsTitle')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'users', title: t('admin.dashboard.reportUserActivityTitle'), desc: t('admin.dashboard.reportUserActivityDesc') },
                  { key: 'projects', title: t('admin.dashboard.reportProjectAnalyticsTitle'), desc: t('admin.dashboard.reportProjectAnalyticsDesc') },
                  { key: 'verifications', title: t('admin.dashboard.reportVerificationTitle'), desc: t('admin.dashboard.reportVerificationDesc') },
                  { key: 'moderation', title: t('admin.dashboard.reportModerationTitle'), desc: t('admin.dashboard.reportModerationDesc') },
                ].map(report => (
                  <div key={report.key} className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium">{report.title}</div>
                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportReport(report.key, 'json')}>
                        <Download className="h-3 w-3 mr-1" />{t('admin.dashboard.exportJsonButton')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportReport(report.key, 'csv')}>
                        <Download className="h-3 w-3 mr-1" />{t('admin.dashboard.exportCsvButton')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
