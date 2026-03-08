import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Factory, Plus, Save, Loader2, TrendingDown, TrendingUp, Flame, Zap, Truck, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EmissionsManagerProps {
  organizationId: string;
  indicators: any[];
  onDataChange: () => void;
}

const SCOPE_INFO = {
  scope1: {
    label: 'Scope 1 — Direct Emissions',
    icon: <Flame className="w-4 h-4" />,
    color: '#ef4444',
    description: 'Direct GHG emissions from owned/controlled sources (fuel combustion, company vehicles, fugitive emissions)',
    examples: ['On-site fuel combustion', 'Company-owned vehicles', 'Refrigerant leaks', 'Industrial processes'],
  },
  scope2: {
    label: 'Scope 2 — Indirect (Energy)',
    icon: <Zap className="w-4 h-4" />,
    color: '#f97316',
    description: 'Indirect GHG emissions from purchased electricity, steam, heating and cooling',
    examples: ['Purchased electricity', 'Purchased steam', 'Purchased heating', 'Purchased cooling'],
  },
  scope3: {
    label: 'Scope 3 — Value Chain',
    icon: <Truck className="w-4 h-4" />,
    color: '#eab308',
    description: 'All other indirect emissions in the value chain (upstream and downstream)',
    examples: ['Business travel', 'Employee commuting', 'Purchased goods', 'Waste disposal', 'Product use'],
  },
};

export default function EmissionsManager({ organizationId, indicators, onDataChange }: EmissionsManagerProps) {
  const { user } = useAuth();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    reporting_year: new Date().getFullYear(),
    carbon_scope1_tonnes: 0,
    carbon_scope2_tonnes: 0,
    carbon_scope3_tonnes: 0,
    energy_consumption_kwh: 0,
    water_consumption_m3: 0,
    waste_generated_tonnes: 0,
    renewable_energy_percentage: 0,
    community_investment: 0,
    data_quality: 'estimated' as string,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('esg_indicators')
          .update({
            ...form,
            esg_score: calculateScore(form),
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Emissions data updated');
      } else {
        const { error } = await supabase
          .from('esg_indicators')
          .insert([{
            organization_id: organizationId,
            created_by: user?.id,
            ...form,
            esg_score: calculateScore(form),
          }]);
        if (error) throw error;
        toast.success('Emissions data recorded');
      }
      setAddDialogOpen(false);
      setEditingId(null);
      resetForm();
      onDataChange();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      reporting_year: new Date().getFullYear(),
      carbon_scope1_tonnes: 0, carbon_scope2_tonnes: 0, carbon_scope3_tonnes: 0,
      energy_consumption_kwh: 0, water_consumption_m3: 0, waste_generated_tonnes: 0,
      renewable_energy_percentage: 0, community_investment: 0, data_quality: 'estimated',
    });
  };

  const openEdit = (ind: any) => {
    setForm({
      reporting_year: ind.reporting_year,
      carbon_scope1_tonnes: ind.carbon_scope1_tonnes || 0,
      carbon_scope2_tonnes: ind.carbon_scope2_tonnes || 0,
      carbon_scope3_tonnes: ind.carbon_scope3_tonnes || 0,
      energy_consumption_kwh: ind.energy_consumption_kwh || 0,
      water_consumption_m3: ind.water_consumption_m3 || 0,
      waste_generated_tonnes: ind.waste_generated_tonnes || 0,
      renewable_energy_percentage: ind.renewable_energy_percentage || 0,
      community_investment: ind.community_investment || 0,
      data_quality: ind.data_quality || 'estimated',
    });
    setEditingId(ind.id);
    setAddDialogOpen(true);
  };

  const calculateScore = (data: typeof form) => {
    let score = 50;
    if (data.renewable_energy_percentage > 50) score += 15;
    else if (data.renewable_energy_percentage > 20) score += 8;
    if (data.data_quality === 'verified') score += 10;
    else if (data.data_quality === 'measured') score += 5;
    const total = data.carbon_scope1_tonnes + data.carbon_scope2_tonnes + data.carbon_scope3_tonnes;
    if (total < 1000) score += 15;
    else if (total < 10000) score += 5;
    if (data.community_investment > 0) score += 10;
    return Math.min(100, Math.max(0, score));
  };

  // Chart data
  const emissionsOverTime = indicators.map(ind => ({
    year: ind.reporting_year,
    'Scope 1': ind.carbon_scope1_tonnes || 0,
    'Scope 2': ind.carbon_scope2_tonnes || 0,
    'Scope 3': ind.carbon_scope3_tonnes || 0,
  })).reverse();

  const latest = indicators[0];
  const pieData = latest ? [
    { name: 'Scope 1', value: latest.carbon_scope1_tonnes || 0, color: '#ef4444' },
    { name: 'Scope 2', value: latest.carbon_scope2_tonnes || 0, color: '#f97316' },
    { name: 'Scope 3', value: latest.carbon_scope3_tonnes || 0, color: '#eab308' },
  ] : [];

  const totalLatest = pieData.reduce((s, d) => s + d.value, 0);

  // Year-over-year change
  const prev = indicators[1];
  const prevTotal = prev ? (prev.carbon_scope1_tonnes || 0) + (prev.carbon_scope2_tonnes || 0) + (prev.carbon_scope3_tonnes || 0) : null;
  const yoyChange = prevTotal && prevTotal > 0 ? ((totalLatest - prevTotal) / prevTotal) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Emissions Tracking (Scope 1, 2, 3)
          </h2>
          <p className="text-sm text-muted-foreground">GHG Protocol compliant carbon accounting</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setAddDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Record Emissions
        </Button>
      </div>

      {/* Scope Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['scope1', 'scope2', 'scope3'] as const).map(scope => {
          const info = SCOPE_INFO[scope];
          const val = latest ? (latest[`carbon_${scope}_tonnes`] || 0) : 0;
          const pct = totalLatest > 0 ? ((val / totalLatest) * 100).toFixed(1) : '0';
          return (
            <Card key={scope}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {info.icon}
                    {info.label}
                  </CardTitle>
                  <Badge variant="secondary" style={{ backgroundColor: info.color + '20', color: info.color }}>{pct}%</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{val.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">tonnes CO2e</p>
                <p className="text-xs text-muted-foreground mt-2">{info.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* YoY Summary */}
      {yoyChange !== null && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            {yoyChange <= 0 ? (
              <TrendingDown className="w-6 h-6 text-green-500" />
            ) : (
              <TrendingUp className="w-6 h-6 text-red-500" />
            )}
            <div>
              <span className={`text-lg font-bold ${yoyChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                year-over-year change ({prev?.reporting_year} → {latest?.reporting_year})
              </span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm font-medium">{totalLatest.toLocaleString()} tCO2e</div>
              <div className="text-xs text-muted-foreground">Current total</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>Emissions Trend by Scope</CardTitle></CardHeader>
            <CardContent>
              {emissionsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={emissionsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Scope 1" fill="#ef4444" />
                    <Bar dataKey="Scope 2" fill="#f97316" />
                    <Bar dataKey="Scope 3" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No emissions data yet. Click "Record Emissions" to start.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader><CardTitle>Current Year Scope Breakdown</CardTitle></CardHeader>
            <CardContent>
              {pieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} innerRadius={60} dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data for current period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Reporting History</CardTitle></CardHeader>
            <CardContent>
              {indicators.length > 0 ? (
                <div className="space-y-3">
                  {indicators.map(ind => {
                    const total = (ind.carbon_scope1_tonnes || 0) + (ind.carbon_scope2_tonnes || 0) + (ind.carbon_scope3_tonnes || 0);
                    return (
                      <div key={ind.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-medium">Reporting Year {ind.reporting_year}</div>
                          <div className="text-sm text-muted-foreground">
                            S1: {(ind.carbon_scope1_tonnes || 0).toLocaleString()} • 
                            S2: {(ind.carbon_scope2_tonnes || 0).toLocaleString()} • 
                            S3: {(ind.carbon_scope3_tonnes || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold">{total.toLocaleString()} tCO2e</div>
                            <Badge variant="secondary" className="text-xs">{ind.data_quality || 'estimated'}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ind)}>Edit</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No records yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Record'} Emissions Data</DialogTitle>
            <DialogDescription>Enter GHG emissions and resource consumption data following GHG Protocol standards.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reporting Year</Label>
                <Select value={form.reporting_year.toString()} onValueChange={v => setForm(f => ({ ...f, reporting_year: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2026, 2025, 2024, 2023, 2022].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Quality</Label>
                <Select value={form.data_quality} onValueChange={v => setForm(f => ({ ...f, data_quality: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimated">Estimated</SelectItem>
                    <SelectItem value="measured">Measured</SelectItem>
                    <SelectItem value="verified">Third-Party Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Scope Inputs */}
            {(['scope1', 'scope2', 'scope3'] as const).map(scope => {
              const info = SCOPE_INFO[scope];
              const fieldKey = `carbon_${scope}_tonnes` as keyof typeof form;
              return (
                <div key={scope} className="space-y-2">
                  <Label className="flex items-center gap-2">{info.icon} {info.label}</Label>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min={0} step={0.1}
                      value={form[fieldKey]}
                      onChange={e => setForm(f => ({ ...f, [fieldKey]: parseFloat(e.target.value) || 0 }))}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">tonnes CO2e</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {info.examples.map(ex => (
                      <Badge key={ex} variant="outline" className="text-xs">{ex}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}

            <Separator />

            {/* Resource Consumption */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Energy Consumption (kWh)</Label>
                <Input type="number" min={0} value={form.energy_consumption_kwh}
                  onChange={e => setForm(f => ({ ...f, energy_consumption_kwh: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Water Consumption (m³)</Label>
                <Input type="number" min={0} value={form.water_consumption_m3}
                  onChange={e => setForm(f => ({ ...f, water_consumption_m3: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Waste Generated (tonnes)</Label>
                <Input type="number" min={0} value={form.waste_generated_tonnes}
                  onChange={e => setForm(f => ({ ...f, waste_generated_tonnes: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Renewable Energy (%)</Label>
                <Input type="number" min={0} max={100} value={form.renewable_energy_percentage}
                  onChange={e => setForm(f => ({ ...f, renewable_energy_percentage: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Community Investment ($)</Label>
                <Input type="number" min={0} value={form.community_investment}
                  onChange={e => setForm(f => ({ ...f, community_investment: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
