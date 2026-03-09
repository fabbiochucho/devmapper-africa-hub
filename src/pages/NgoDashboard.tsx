import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, TrendingUp, DollarSign, Target, Plus, FolderOpen, MapPin, Bot, ExternalLink, ShieldCheck, Bell } from 'lucide-react';
import AICopilot from '@/components/ai/AICopilot';
import ComplianceAssessment from '@/components/compliance/ComplianceAssessment';
import VerificationReviewDialog from '@/components/ngo/VerificationReviewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProjects } from '@/hooks/useMyProjects';
import { useNavigate } from 'react-router-dom';
import { sdgGoals } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  planned: { variant: 'secondary', label: 'Planned' },
  in_progress: { variant: 'default', label: 'In Progress' },
  completed: { variant: 'outline', label: 'Completed' },
  stalled: { variant: 'destructive', label: 'Stalled' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
};

const NgoDashboard = () => {
  const { user, hasRole } = useAuth();
  const { projects, loading } = useMyProjects();
  const navigate = useNavigate();

  const ownProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter(p => p.user_id === user.id);
  }, [projects, user]);

  const totals = useMemo(() => {
    const totalBudget = ownProjects.reduce((sum, p) => sum + (p.cost || 0), 0);
    const totalBeneficiaries = ownProjects.reduce((sum, p) => sum + (p.beneficiaries || 0), 0);
    const active = ownProjects.filter(p => p.project_status === 'in_progress').length;
    return { totalBudget, totalBeneficiaries, active };
  }, [ownProjects]);

  if (!hasRole('ngo_member')) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You need to be an NGO member to access this dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const getSdgLabel = (goal: number) => {
    const found = sdgGoals.find(g => g.value === goal.toString());
    return found ? `SDG ${goal}: ${found.title}` : `SDG ${goal}`;
  };

  const renderProjectCard = (p: typeof ownProjects[0]) => {
    const cfg = statusConfig[p.project_status] || statusConfig.planned;
    return (
      <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/my-projects?project=${p.id}`)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{p.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{p.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cfg.variant} className="shrink-0">{cfg.label}</Badge>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" /> {getSdgLabel(p.sdg_goal)}
            </span>
            {p.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {p.location}
              </span>
            )}
            {p.cost != null && p.cost > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> {p.cost.toLocaleString()} {p.cost_currency || 'USD'}
              </span>
            )}
            {p.beneficiaries != null && p.beneficiaries > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {p.beneficiaries.toLocaleString()} beneficiaries
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filterByStatus = (status: string) => ownProjects.filter(p => p.project_status === status);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">NGO Project Dashboard</h1>
          <p className="text-muted-foreground">Manage your NGO projects using the unified reporting pipeline</p>
        </div>
        <Button onClick={() => navigate('/submit-report')}>
          <Plus className="mr-2 h-4 w-4" />Submit Project Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{ownProjects.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${totals.totalBudget.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.totalBeneficiaries.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({ownProjects.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({filterByStatus('in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterByStatus('completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {ownProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No projects yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Submit your first report to create an NGO project.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">{ownProjects.map(renderProjectCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-4">
          {filterByStatus('in_progress').length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No active projects.</p>
          ) : (
            <div className="space-y-3">{filterByStatus('in_progress').map(renderProjectCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {filterByStatus('completed').length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No completed projects.</p>
          ) : (
            <div className="space-y-3">{filterByStatus('completed').map(renderProjectCard)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* NGO Verification Notifications Panel */}
      <VerificationNotificationsPanel userId={user?.id || ''} />

      {/* NGO Verification: verify public projects (PRD V7 - NGO can validate project data) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verify Public Projects
          </CardTitle>
          <CardDescription>As an NGO, you can verify community and public projects to increase their trust score.</CardDescription>
        </CardHeader>
        <CardContent>
          <PublicProjectVerifier userId={user?.id || ''} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />Recommended next step
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Use <strong>My Projects</strong> for milestone tracking and collaboration across stakeholders.
          </p>
          <Button variant="outline" onClick={() => navigate('/my-projects')}>Go to My Projects</Button>
        </CardContent>
      </Card>

      {/* Compliance Assessment */}
      <ComplianceAssessment actorType="ngo" />

      {/* AI Copilot */}
      <AICopilot projectData={{ context: 'ngo_impact', projectCount: ownProjects.length }} />
    </div>
  );
};

// Sub-component: shows recent verification-related notifications for NGO
function VerificationNotificationsPanel({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .in('type', ['success', 'warning'])
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setNotifications(data || []);
        setLoading(false);
      });
  }, [userId]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary" />
          Verification Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-1">{unreadCount} new</Badge>
          )}
        </CardTitle>
        <CardDescription>Updates on project verifications you've submitted or received.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No verification notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  n.is_read ? 'bg-muted/20' : 'bg-primary/5 border border-primary/10'
                }`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${n.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
                {n.link && (
                  <Button variant="ghost" size="sm" className="shrink-0 h-6 text-xs" onClick={(e) => { e.stopPropagation(); window.location.href = n.link; }}>
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sub-component: allows NGOs to verify public projects with proper review UI
function PublicProjectVerifier({ userId }: { userId: string }) {
  const [publicProjects, setPublicProjects] = useState<any[]>([]);
  const [loadingVerify, setLoadingVerify] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const loadProjects = () => {
    supabase
      .from('reports')
      .select('id, title, description, sdg_goal, location, project_status, user_id, submitted_at')
      .eq('visibility', 'public')
      .neq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setPublicProjects(data || []);
        setLoadingVerify(false);
      });
  };

  useEffect(() => {
    loadProjects();
  }, [userId]);

  if (loadingVerify) return <p className="text-sm text-muted-foreground">Loading public projects...</p>;
  if (publicProjects.length === 0) return <p className="text-sm text-muted-foreground">No public projects available for verification.</p>;

  return (
    <>
      <div className="space-y-3">
        {publicProjects.map(p => (
          <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">SDG {p.sdg_goal} • {p.location || 'No location'} • {p.project_status}</p>
            </div>
            <Button size="sm" onClick={() => { setSelectedProject(p); setReviewOpen(true); }}>
              <ShieldCheck className="h-3 w-3 mr-1" />Review & Verify
            </Button>
          </div>
        ))}
      </div>
      <VerificationReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        project={selectedProject}
        userId={userId}
        onVerified={() => {
          loadProjects();
        }}
      />
    </>
  );
}

export default NgoDashboard;
