import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Calendar, DollarSign, Target, TrendingUp, Users, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useMyProjects, ProjectReport } from '@/hooks/useMyProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProjectMilestones from '@/components/project/ProjectMilestones';
import { sdgGoals } from '@/lib/constants';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ExportManager from '@/components/export/ExportManager';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const statusConfig: Record<string, { color: string; label: string }> = {
  planned: { color: 'bg-muted text-muted-foreground', label: 'Planned' },
  in_progress: { color: 'bg-primary/10 text-primary', label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Completed' },
  stalled: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Stalled' },
  cancelled: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
};

const relationshipLabels: Record<string, string> = {
  owner: 'Owner',
  sponsor: 'Sponsor',
  funder: 'Funder',
  partner: 'Partner',
  implementer: 'Implementer',
};

const MyProjects = () => {
  const { projects, loading, refetch } = useMyProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be signed in to view your projects.</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading your projects...</p>
      </div>
    );
  }

  const ownProjects = projects.filter(p => p.user_id === user.id);
  const affiliatedProjects = projects.filter(p => p.user_id !== user.id);
  const activeProjects = projects.filter(p => p.project_status === 'in_progress');
  const totalCost = projects.reduce((sum, p) => sum + (p.cost || 0), 0);

  const getSdgLabel = (goal: number) => {
    const found = sdgGoals.find(g => g.value === goal.toString());
    return found ? `SDG ${goal}` : `SDG ${goal}`;
  };

  const renderProjectCard = (project: ProjectReport) => {
    const isExpanded = expandedProject === project.id;
    const status = statusConfig[project.project_status] || statusConfig.planned;
    const isOwner = project.user_id === user.id;

    return (
      <Card key={project.id} className="transition-all">
        <CardHeader className="cursor-pointer" onClick={() => setExpandedProject(isExpanded ? null : project.id)}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{project.title}</CardTitle>
                <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                {project.relationship_type && project.relationship_type !== 'owner' && (
                  <Badge variant="outline" className="text-xs">
                    {relationshipLabels[project.relationship_type] || project.relationship_type}
                  </Badge>
                )}
                {project.is_verified && <Badge className="bg-green-600 text-white text-xs">Verified</Badge>}
              </div>
              <CardDescription className="mt-1 line-clamp-2">{project.description}</CardDescription>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {project.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" /> {project.location}
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" /> {getSdgLabel(project.sdg_goal)}
            </div>
            {project.cost && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" /> {project.cost.toLocaleString()} {project.cost_currency || 'USD'}
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" /> {format(new Date(project.start_date), 'MMM yyyy')}
              </div>
            )}
          </div>

          {isExpanded && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {project.sponsor && <div><span className="font-medium">Sponsor:</span> {project.sponsor}</div>}
                {project.funder && <div><span className="font-medium">Funder:</span> {project.funder}</div>}
                {project.contractor && <div><span className="font-medium">Contractor:</span> {project.contractor}</div>}
                {project.beneficiaries && <div><span className="font-medium">Beneficiaries:</span> {project.beneficiaries.toLocaleString()}</div>}
                {project.start_date && <div><span className="font-medium">Start:</span> {format(new Date(project.start_date), 'PPP')}</div>}
                {project.end_date && <div><span className="font-medium">End:</span> {format(new Date(project.end_date), 'PPP')}</div>}
              </div>

              <ProjectMilestones reportId={project.id} canEdit={isOwner} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Manage your projects, track milestones, and view impact</p>
        </div>
        <Button onClick={() => navigate('/submit-report')}>
          <Plus className="mr-2 h-4 w-4" /> New Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{projects.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeProjects.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${totalCost.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{affiliatedProjects.length}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
          <TabsTrigger value="own">My Reports ({ownProjects.length})</TabsTrigger>
          <TabsTrigger value="affiliated">Affiliated ({affiliatedProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No projects yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Submit your first report to get started.</p>
                <Button className="mt-4" onClick={() => navigate('/submit-report')}>
                  <Plus className="mr-2 h-4 w-4" /> Submit Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map(renderProjectCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="own" className="space-y-4 mt-4">
          {ownProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">You haven't submitted any reports yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">{ownProjects.map(renderProjectCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="affiliated" className="space-y-4 mt-4">
          {affiliatedProjects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No affiliated projects. When other users add you as a sponsor, funder, or partner, projects will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">{affiliatedProjects.map(renderProjectCard)}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProjects;
