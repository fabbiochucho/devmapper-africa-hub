import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Target, TrendingUp, Calendar, Users, Save, X, Bot } from 'lucide-react';
import AICopilot from '@/components/ai/AICopilot';
import ComplianceAssessment from '@/components/compliance/ComplianceAssessment';
import { useAuth } from '@/contexts/AuthContext';
import EntityLocationsManager from '@/components/locations/EntityLocationsManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sdgGoals } from '@/lib/constants';

interface CorporateTarget {
  id: string;
  title: string;
  description: string;
  sdg_goals: number[];
  target_value: number;
  current_value: number;
  unit: string;
  target_date: string;
  status: string;
  visibility: string;
  created_at: string;
}

type TargetStatus = 'active' | 'on_track' | 'at_risk' | 'delayed' | 'completed';

const statusLabel: Record<TargetStatus, string> = {
  active: 'active',
  on_track: 'on track',
  at_risk: 'at risk',
  delayed: 'delayed',
  completed: 'completed',
};

const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  if (status === 'completed') return 'default';
  if (status === 'delayed') return 'destructive';
  if (status === 'at_risk') return 'outline';
  return 'secondary';
};

const getProgressPercentage = (current: number, target: number) => {
  return Math.min((current / Math.max(1, target)) * 100, 100);
};

// Shared target card component
const TargetCard = ({ target, showEdit, onStartEdit, editingId, editCurrentValue, setEditCurrentValue, editStatus, setEditStatus, savingEdit, onSaveEdit, onCancelEdit }: {
  target: CorporateTarget;
  showEdit?: boolean;
  onStartEdit?: (t: CorporateTarget) => void;
  editingId?: string | null;
  editCurrentValue?: string;
  setEditCurrentValue?: (v: string) => void;
  editStatus?: TargetStatus;
  setEditStatus?: (v: TargetStatus) => void;
  savingEdit?: boolean;
  onSaveEdit?: (id: string) => void;
  onCancelEdit?: () => void;
}) => {
  const isEditing = editingId === target.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">{target.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(target.status)}>
              {(statusLabel[target.status as TargetStatus] || target.status).replace('_', ' ')}
            </Badge>
            {showEdit && !isEditing && onStartEdit && (
              <Button size="sm" variant="outline" onClick={() => onStartEdit(target)}>
                Update
              </Button>
            )}
          </div>
        </div>
        <CardDescription>{target.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{target.status === 'completed' ? 'Final Result' : 'Progress'}</span>
            <span>{target.current_value} / {target.target_value} {target.unit}</span>
          </div>
          <Progress value={getProgressPercentage(target.current_value, target.target_value)} />
        </div>

        {isEditing && setEditCurrentValue && setEditStatus && editCurrentValue !== undefined && editStatus && onSaveEdit && onCancelEdit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-3">
            <div className="space-y-2">
              <Label>Current value</Label>
              <Input type="number" value={editCurrentValue} onChange={(e) => setEditCurrentValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TargetStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['active','on_track','at_risk','delayed','completed'] as TargetStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={savingEdit}>
                <X className="mr-2 h-4 w-4" />Cancel
              </Button>
              <Button size="sm" onClick={() => onSaveEdit(target.id)} disabled={savingEdit}>
                <Save className="mr-2 h-4 w-4" />Save
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Target Date: {new Date(target.target_date).toLocaleDateString()}</span>
          <span>SDGs: {target.sdg_goals.length > 0 ? target.sdg_goals.join(', ') : 'None'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

const CorporateDashboard = () => {
  const { user, hasRole } = useAuth();
  const [targets, setTargets] = useState<CorporateTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCurrentValue, setEditCurrentValue] = useState<string>('');
  const [editStatus, setEditStatus] = useState<TargetStatus>('active');
  const [savingEdit, setSavingEdit] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sdg_goals: [] as number[],
    target_value: '',
    unit: '',
    target_date: '',
    visibility: 'public'
  });

  useEffect(() => {
    if (user && hasRole('company_representative')) {
      fetchTargets();
    }
  }, [user, hasRole]);

  const fetchTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_targets')
        .select('*')
        .eq('company_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTargets(data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const toggleSdgGoal = (goalNumber: number) => {
    setFormData(prev => ({
      ...prev,
      sdg_goals: prev.sdg_goals.includes(goalNumber)
        ? prev.sdg_goals.filter(g => g !== goalNumber)
        : [...prev.sdg_goals, goalNumber]
    }));
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.sdg_goals.length === 0) {
      toast.error('Please select at least one SDG goal');
      return;
    }

    try {
      const { error } = await supabase
        .from('corporate_targets')
        .insert([{
          company_id: user?.id,
          title: formData.title,
          description: formData.description,
          sdg_goals: formData.sdg_goals,
          target_value: parseFloat(formData.target_value),
          unit: formData.unit,
          target_date: formData.target_date,
          visibility: formData.visibility
        }]);

      if (error) throw error;

      toast.success('Target created successfully!');
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', sdg_goals: [], target_value: '', unit: '', target_date: '', visibility: 'public' });
      fetchTargets();
    } catch (error) {
      console.error('Error creating target:', error);
      toast.error('Failed to create target');
    }
  };

  const startEdit = (t: CorporateTarget) => {
    setEditingId(t.id);
    setEditCurrentValue(String(t.current_value ?? 0));
    setEditStatus((t.status as TargetStatus) || 'active');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCurrentValue('');
    setEditStatus('active');
  };

  const saveEdit = async (targetId: string) => {
    if (!user) return;
    const currentValue = Number(editCurrentValue);
    if (Number.isNaN(currentValue) || currentValue < 0) {
      toast.error('Current value must be a valid number');
      return;
    }
    try {
      setSavingEdit(true);
      const { error } = await supabase
        .from('corporate_targets')
        .update({ current_value: currentValue, status: editStatus })
        .eq('id', targetId)
        .eq('company_id', user.id);
      if (error) throw error;
      toast.success('Target updated');
      cancelEdit();
      fetchTargets();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update target');
    } finally {
      setSavingEdit(false);
    }
  };

  const stats = useMemo(() => ({
    total: targets.length,
    completed: targets.filter(t => t.status === 'completed').length,
    onTrack: targets.filter(t => t.status === 'on_track').length,
    atRisk: targets.filter(t => t.status === 'at_risk' || t.status === 'delayed').length,
  }), [targets]);

  if (!hasRole('company_representative')) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You need to be a company representative to access this dashboard.</p>
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

  const editProps = {
    showEdit: true,
    onStartEdit: startEdit,
    editingId,
    editCurrentValue,
    setEditCurrentValue,
    editStatus,
    setEditStatus,
    savingEdit,
    onSaveEdit: saveEdit,
    onCancelEdit: cancelEdit,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Corporate SDG Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your corporate sustainability targets</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Target</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New SDG Target</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTarget} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Target Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Reduce carbon emissions by 50%" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detailed description of the target" required />
              </div>

              {/* SDG Goal Selector */}
              <div className="space-y-2">
                <Label>SDG Goals <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Select one or more SDG goals this target contributes to.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {sdgGoals.map(goal => (
                    <label key={goal.number} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1">
                      <Checkbox
                        checked={formData.sdg_goals.includes(goal.number)}
                        onCheckedChange={() => toggleSdgGoal(goal.number)}
                      />
                      <span className="truncate">SDG {goal.number}</span>
                    </label>
                  ))}
                </div>
                {formData.sdg_goals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.sdg_goals.sort((a,b) => a-b).map(g => (
                      <Badge key={g} variant="secondary" className="text-xs">SDG {g}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input id="target_value" type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} placeholder="100" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g., tons CO2" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input id="target_date" type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit">Create Target</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Targets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.onTrack}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.atRisk}</div></CardContent>
        </Card>
      </div>

      <EntityLocationsManager entityType="company" />

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Targets</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {targets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No targets</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first SDG target.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {targets.map(target => <TargetCard key={target.id} target={target} {...editProps} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {targets.filter(t => t.status === 'active' || t.status === 'on_track').map(target => (
              <TargetCard key={target.id} target={target} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {targets.filter(t => t.status === 'completed').map(target => (
              <TargetCard key={target.id} target={target} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick link to PM workspace */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap pt-6">
          <p className="text-sm text-muted-foreground">
            Use <strong>Project Management</strong> for full lifecycle tracking, milestones, and verification.
          </p>
          <Button variant="outline" onClick={() => navigate('/my-projects')}>Go to Project Management</Button>
        </CardContent>
      </Card>

      {/* Compliance Assessment */}
      <ComplianceAssessment actorType="corporate" countryCode={user?.user_metadata?.country} />

      {/* AI Copilot */}
      <div className="mt-6">
        <AICopilot projectData={{ context: 'corporate_esg', targetCount: targets.length }} />
      </div>
    </div>
  );
};

export default CorporateDashboard;
