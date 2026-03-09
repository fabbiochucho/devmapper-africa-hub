import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, TrendingUp, DollarSign, Target, Plus, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProjects } from '@/hooks/useMyProjects';
import { useNavigate } from 'react-router-dom';

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
        <p className="text-muted-foreground">
          You need to be an NGO member to access this dashboard.
        </p>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">NGO Project Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your NGO projects using the unified reporting pipeline
          </p>
        </div>
        <Button onClick={() => navigate('/submit-report')}>
          <Plus className="mr-2 h-4 w-4" />
          Submit Project Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownProjects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalBeneficiaries.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {ownProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No projects yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submit your first report to create an NGO project.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ownProjects.map(p => (
                <Card key={p.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{p.title}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{p.project_status}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-4">
          <div className="space-y-3">
            {ownProjects.filter(p => p.project_status === 'in_progress').map(p => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          <div className="space-y-3">
            {ownProjects.filter(p => p.project_status === 'completed').map(p => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Recommended next step
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Use <strong>My Projects</strong> for milestone tracking and collaboration across stakeholders.
          </p>
          <Button variant="outline" onClick={() => navigate('/my-projects')}>
            Go to My Projects
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NgoDashboard;
