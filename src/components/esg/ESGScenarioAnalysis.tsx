import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { Plus, Save, Play, TrendingDown, Target, Leaf, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  baseline_year: number;
  target_year: number;
  assumptions: {
    renewable_target: number;
    efficiency_improvement: number;
    scope3_reduction: number;
    carbon_price: number;
  };
  results: {
    projected_emissions: number[];
    cost_savings: number;
    carbon_cost: number;
    roi_years: number;
  } | null;
  status: string;
  created_at: string;
}

interface ESGScenarioAnalysisProps {
  organizationId: string;
  currentEmissions: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  scenariosLimit: number;
}

export default function ESGScenarioAnalysis({ 
  organizationId, 
  currentEmissions,
  scenariosLimit 
}: ESGScenarioAnalysisProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  // New scenario form state
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    baseline_year: new Date().getFullYear(),
    target_year: 2030,
    assumptions: {
      renewable_target: 50,
      efficiency_improvement: 20,
      scope3_reduction: 30,
      carbon_price: 50
    }
  });

  useEffect(() => {
    loadScenarios();
  }, [organizationId]);

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('esg_scenarios')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Type assertion with proper transformation
      const typedScenarios = (data || []).map(s => ({
        ...s,
        assumptions: s.assumptions as unknown as Scenario['assumptions'],
        results: s.results as unknown as Scenario['results']
      }));
      setScenarios(typedScenarios);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      toast.error('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const calculateScenarioResults = (assumptions: typeof newScenario.assumptions) => {
    const baselineTotal = currentEmissions.scope1 + currentEmissions.scope2 + currentEmissions.scope3;
    const years = newScenario.target_year - newScenario.baseline_year;
    
    // Calculate annual reduction based on assumptions
    const scope2Reduction = (currentEmissions.scope2 * assumptions.renewable_target) / 100;
    const efficiencyReduction = (baselineTotal * assumptions.efficiency_improvement) / 100;
    const scope3Reduction = (currentEmissions.scope3 * assumptions.scope3_reduction) / 100;
    
    const totalReduction = scope2Reduction + efficiencyReduction + scope3Reduction;
    const annualReduction = totalReduction / years;
    
    // Project emissions over time
    const projected_emissions = [];
    let currentTotal = baselineTotal;
    for (let i = 0; i <= years; i++) {
      projected_emissions.push(Math.max(0, currentTotal));
      currentTotal -= annualReduction;
    }
    
    // Calculate financial impact
    const carbon_cost = baselineTotal * assumptions.carbon_price;
    const future_carbon_cost = (baselineTotal - totalReduction) * assumptions.carbon_price;
    const cost_savings = carbon_cost - future_carbon_cost;
    
    // Simple ROI calculation (assuming implementation cost is 2x first year savings)
    const implementation_cost = cost_savings * 2;
    const roi_years = implementation_cost / (cost_savings / years);
    
    return {
      projected_emissions,
      cost_savings: Math.round(cost_savings),
      carbon_cost: Math.round(future_carbon_cost),
      roi_years: Math.round(roi_years * 10) / 10
    };
  };

  const createScenario = async () => {
    if (scenarios.length >= scenariosLimit && scenariosLimit > 0) {
      toast.error(`You've reached your limit of ${scenariosLimit} scenarios. Upgrade to create more.`);
      return;
    }

    try {
      const results = calculateScenarioResults(newScenario.assumptions);
      
      const { data, error } = await supabase
        .from('esg_scenarios')
        .insert({
          organization_id: organizationId,
          name: newScenario.name,
          description: newScenario.description,
          baseline_year: newScenario.baseline_year,
          target_year: newScenario.target_year,
          assumptions: newScenario.assumptions,
          results,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      const typedScenario = {
        ...data,
        assumptions: data.assumptions as unknown as Scenario['assumptions'],
        results: data.results as unknown as Scenario['results']
      };
      
      setScenarios(prev => [typedScenario, ...prev]);
      setIsCreateOpen(false);
      setNewScenario({
        name: '',
        description: '',
        baseline_year: new Date().getFullYear(),
        target_year: 2030,
        assumptions: {
          renewable_target: 50,
          efficiency_improvement: 20,
          scope3_reduction: 30,
          carbon_price: 50
        }
      });
      toast.success('Scenario created successfully');
    } catch (error) {
      console.error('Error creating scenario:', error);
      toast.error('Failed to create scenario');
    }
  };

  const deleteScenario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('esg_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setScenarios(prev => prev.filter(s => s.id !== id));
      if (selectedScenario?.id === id) setSelectedScenario(null);
      toast.success('Scenario deleted');
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  };

  const getProjectionChartData = (scenario: Scenario) => {
    if (!scenario.results?.projected_emissions) return [];
    
    return scenario.results.projected_emissions.map((emissions, index) => ({
      year: scenario.baseline_year + index,
      emissions: Math.round(emissions),
      target: Math.round((currentEmissions.scope1 + currentEmissions.scope2 + currentEmissions.scope3) * 
        (1 - (index / (scenario.target_year - scenario.baseline_year)) * 0.5))
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scenario Analysis</h2>
          <p className="text-muted-foreground">
            Model different decarbonization pathways and their financial impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {scenarios.length} / {scenariosLimit > 0 ? scenariosLimit : '∞'} scenarios
          </Badge>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Scenario</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scenario Name</Label>
                    <Input 
                      value={newScenario.name}
                      onChange={e => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Net Zero 2030"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Year</Label>
                    <Input 
                      type="number"
                      value={newScenario.target_year}
                      onChange={e => setNewScenario(prev => ({ ...prev, target_year: parseInt(e.target.value) }))}
                      min={new Date().getFullYear() + 1}
                      max={2050}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newScenario.description}
                    onChange={e => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the key assumptions and strategies..."
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Assumptions</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Renewable Energy Target</Label>
                      <span className="text-sm text-muted-foreground">
                        {newScenario.assumptions.renewable_target}%
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.assumptions.renewable_target]}
                      onValueChange={([value]) => setNewScenario(prev => ({
                        ...prev,
                        assumptions: { ...prev.assumptions, renewable_target: value }
                      }))}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Energy Efficiency Improvement</Label>
                      <span className="text-sm text-muted-foreground">
                        {newScenario.assumptions.efficiency_improvement}%
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.assumptions.efficiency_improvement]}
                      onValueChange={([value]) => setNewScenario(prev => ({
                        ...prev,
                        assumptions: { ...prev.assumptions, efficiency_improvement: value }
                      }))}
                      max={50}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Scope 3 Reduction Target</Label>
                      <span className="text-sm text-muted-foreground">
                        {newScenario.assumptions.scope3_reduction}%
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.assumptions.scope3_reduction]}
                      onValueChange={([value]) => setNewScenario(prev => ({
                        ...prev,
                        assumptions: { ...prev.assumptions, scope3_reduction: value }
                      }))}
                      max={80}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Carbon Price ($/tonne)</Label>
                      <span className="text-sm text-muted-foreground">
                        ${newScenario.assumptions.carbon_price}
                      </span>
                    </div>
                    <Slider
                      value={[newScenario.assumptions.carbon_price]}
                      onValueChange={([value]) => setNewScenario(prev => ({
                        ...prev,
                        assumptions: { ...prev.assumptions, carbon_price: value }
                      }))}
                      max={200}
                      step={10}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createScenario} disabled={!newScenario.name}>
                  <Save className="w-4 h-4 mr-2" />
                  Create Scenario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Scenarios Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first scenario to model different decarbonization pathways
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Scenario
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List */}
          <div className="space-y-4">
            <h3 className="font-medium">Your Scenarios</h3>
            {scenarios.map(scenario => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-colors ${
                  selectedScenario?.id === scenario.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{scenario.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {scenario.baseline_year} → {scenario.target_year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={scenario.status === 'active' ? 'default' : 'secondary'}>
                        {scenario.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScenario(scenario.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {scenario.results && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Savings</span>
                        <p className="font-medium text-green-600">
                          ${scenario.results.cost_savings.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ROI</span>
                        <p className="font-medium">{scenario.results.roi_years} years</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scenario Details */}
          <div className="lg:col-span-2">
            {selectedScenario ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedScenario.name}</CardTitle>
                  <CardDescription>{selectedScenario.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <TrendingDown className="w-6 h-6 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold">
                        {Math.round(((currentEmissions.scope1 + currentEmissions.scope2 + currentEmissions.scope3) - 
                          (selectedScenario.results?.projected_emissions?.slice(-1)[0] || 0)) / 
                          (currentEmissions.scope1 + currentEmissions.scope2 + currentEmissions.scope3) * 100)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Emission Reduction</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Leaf className="w-6 h-6 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold">
                        ${(selectedScenario.results?.cost_savings || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Cost Savings</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Target className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold">
                        {selectedScenario.results?.roi_years || '-'} yrs
                      </p>
                      <p className="text-sm text-muted-foreground">Payback Period</p>
                    </div>
                  </div>

                  {/* Projection Chart */}
                  <div>
                    <h4 className="font-medium mb-4">Emissions Projection</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={getProjectionChartData(selectedScenario)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="emissions" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.3}
                          name="Projected Emissions (tonnes)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Assumptions Summary */}
                  <div>
                    <h4 className="font-medium mb-3">Assumptions</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Renewable Energy Target</span>
                        <span className="font-medium">{selectedScenario.assumptions.renewable_target}%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Efficiency Improvement</span>
                        <span className="font-medium">{selectedScenario.assumptions.efficiency_improvement}%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Scope 3 Reduction</span>
                        <span className="font-medium">{selectedScenario.assumptions.scope3_reduction}%</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Carbon Price</span>
                        <span className="font-medium">${selectedScenario.assumptions.carbon_price}/tonne</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a scenario to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}