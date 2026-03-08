import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Heart, Users, MapPin, TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import EntityLocationsManager from '@/components/locations/EntityLocationsManager';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NgoProject {
  id: string;
  title: string;
  description: string;
  sdg_goals: number[];
  budget: number;
  spent_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  location: string;
  beneficiaries: number;
  visibility: string;
  created_at: string;
}

const NgoDashboard = () => {
  const { user, hasRole } = useAuth();
  const [projects, setProjects] = useState<NgoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sdg_goals: [] as number[],
    budget: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
    location: '',
    beneficiaries: '',
    visibility: 'public'
  });

  useEffect(() => {
    if (user && hasRole('ngo_member')) {
      fetchProjects();
    }
  }, [user, hasRole]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('government_projects') // Reusing government_projects table for NGO projects
        .select('*')
        .eq('government_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('government_projects')
        .insert([{
          government_id: user?.id,
          title: formData.title,
          description: formData.description,
          sdg_goals: formData.sdg_goals,
          budget: parseFloat(formData.budget),
          currency: formData.currency,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          beneficiaries: parseInt(formData.beneficiaries),
          visibility: formData.visibility,
          status: 'planning'
        }]);

      if (error) throw error;
      
      toast.success('Project created successfully!');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        sdg_goals: [],
        budget: '',
        currency: 'USD',
        start_date: '',
        end_date: '',
        location: '',
        beneficiaries: '',
        visibility: 'public'
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBudgetProgress = (spent: number, total: number) => {
    return Math.min((spent / total) * 100, 100);
  };

  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalSpent = projects.reduce((sum, project) => sum + (project.spent_amount || 0), 0);
  const totalBeneficiaries = projects.reduce((sum, project) => sum + (project.beneficiaries || 0), 0);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">NGO Project Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your organization's development projects and impact
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Clean Water Initiative for Rural Communities"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the project goals and activities"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="100000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Lagos, Nigeria"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="beneficiaries">Expected Beneficiaries</Label>
                  <Input
                    id="beneficiaries"
                    type="number"
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBeneficiaries.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-location Manager */}
      <EntityLocationsManager entityType="ngo" />

      {/* Projects List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first development project.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget Utilized</span>
                        <span>
                          ${project.spent_amount?.toLocaleString() || 0} / ${project.budget?.toLocaleString() || 0}
                        </span>
                      </div>
                      <Progress 
                        value={getBudgetProgress(project.spent_amount || 0, project.budget || 1)} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {project.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {project.beneficiaries?.toLocaleString() || 0} people
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                      <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                    </div>
                    
                    {project.sdg_goals && project.sdg_goals.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.sdg_goals.map((sdg) => (
                          <Badge key={sdg} variant="secondary" className="text-xs">
                            SDG {sdg}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {['active', 'planning', 'completed'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects
                .filter(p => p.status === status)
                .map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Budget Utilized</span>
                          <span>
                            ${project.spent_amount?.toLocaleString() || 0} / ${project.budget?.toLocaleString() || 0}
                          </span>
                        </div>
                        <Progress 
                          value={getBudgetProgress(project.spent_amount || 0, project.budget || 1)} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {project.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {project.beneficiaries?.toLocaleString() || 0} people
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                        <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                      </div>
                      
                      {project.sdg_goals && project.sdg_goals.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.sdg_goals.map((sdg) => (
                            <Badge key={sdg} variant="secondary" className="text-xs">
                              SDG {sdg}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default NgoDashboard;