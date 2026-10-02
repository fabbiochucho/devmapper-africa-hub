import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Factory, Plus, Save, Loader2, TrendingDown, TrendingUp, Flame, Zap, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { errorMessageOf } from '@/lib/error-handler';
import type { Tables } from "@/integrations/supabase/types";

interface EmissionsManagerProps {
  organizationId: string;
  indicators: Tables<'esg_indicators'>[];
  onDataChange: () => void;
}

const getScopeInfo = (t: (key: string) => string) => ({
  scope1: {
    label: t('esg.emissionsManager.scope1Label'),
    icon: <Flame className="w-4 h-4" />,
    color: '#ef4444',
    description: t('esg.emissionsManager.scope1Description'),
    examples: [
      t('esg.emissionsManager.scope1Example1'),
      t('esg.emissionsManager.scope1Example2'),
      t('esg.emissionsManager.scope1Example3'),
      t('esg.emissionsManager.scope1Example4'),
    ],
  },
  scope2: {
    label: t('esg.emissionsManager.scope2Label'),
    icon: <Zap className="w-4 h-4" />,
    color: '#f97316',
    description: t('esg.emissionsManager.scope2Description'),
    examples: [
      t('esg.emissionsManager.scope2Example1'),
      t('esg.emissionsManager.scope2Example2'),
      t('esg.emissionsManager.scope2Example3'),
      t('esg.emissionsManager.scope2Example4'),
    ],
  },
  scope3: {
    label: t('esg.emissionsManager.scope3Label'),
    icon: <Truck className="w-4 h-4" />,
    color: '#eab308',
    description: t('esg.emissionsManager.scope3Description'),
    examples: [
      t('esg.emissionsManager.scope3Example1'),
      t('esg.emissionsManager.scope3Example2'),
      t('esg.emissionsManager.scope3Example3'),
      t('esg.emissionsManager.scope3Example4'),
      t('esg.emissionsManager.scope3Example5'),
    ],
  },
});

export default function EmissionsManager({ organizationId, indicators, onDataChange }: EmissionsManagerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const SCOPE_INFO = getScopeInfo(t);
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
        toast.success(t('esg.emissionsManager.updateSuccess'));
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
        toast.success(t('esg.emissionsManager.recordSuccess'));
      }
      setAddDialogOpen(false);
      setEditingId(null);
      resetForm();
      onDataChange();
    } catch (err: unknown) {
      console.error(err);
      toast.error(errorMessageOf(err) || t('esg.emissionsManager.saveFailedError'));
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

  const openEdit = (ind: Tables<'esg_indicators'>) => {
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
            {t('esg.emissionsManager.headerTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('esg.emissionsManager.headerSubtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setAddDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('esg.emissionsManager.recordEmissionsButton')}
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
                <p className="text-xs text-muted-foreground">{t('esg.emissionsManager.tonnesCo2eUnit')}</p>
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
                {t('esg.emissionsManager.yoyChangeLabel', { prevYear: prev?.reporting_year, latestYear: latest?.reporting_year })}
              </span>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm font-medium">{t('esg.emissionsManager.tco2eValue', { value: totalLatest.toLocaleString() })}</div>
              <div className="text-xs text-muted-foreground">{t('esg.emissionsManager.currentTotalLabel')}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">{t('esg.emissionsManager.trendTab')}</TabsTrigger>
          <TabsTrigger value="breakdown">{t('esg.emissionsManager.breakdownTab')}</TabsTrigger>
          <TabsTrigger value="history">{t('esg.emissionsManager.historyTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle>{t('esg.emissionsManager.trendChartTitle')}</CardTitle></CardHeader>
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
                <p className="text-center text-muted-foreground py-12">{t('esg.emissionsManager.noTrendDataMessage')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader><CardTitle>{t('esg.emissionsManager.breakdownChartTitle')}</CardTitle></CardHeader>
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
                <p className="text-center text-muted-foreground py-12">{t('esg.emissionsManager.noBreakdownDataMessage')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>{t('esg.emissionsManager.historyTitle')}</CardTitle></CardHeader>
            <CardContent>
              {indicators.length > 0 ? (
                <div className="space-y-3">
                  {indicators.map(ind => {
                    const total = (ind.carbon_scope1_tonnes || 0) + (ind.carbon_scope2_tonnes || 0) + (ind.carbon_scope3_tonnes || 0);
                    return (
                      <div key={ind.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-medium">{t('esg.emissionsManager.reportingYearHeading', { year: ind.reporting_year })}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('esg.emissionsManager.scopeS1Prefix')} {(ind.carbon_scope1_tonnes || 0).toLocaleString()} •
                            {t('esg.emissionsManager.scopeS2Prefix')} {(ind.carbon_scope2_tonnes || 0).toLocaleString()} •
                            {t('esg.emissionsManager.scopeS3Prefix')} {(ind.carbon_scope3_tonnes || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold">{t('esg.emissionsManager.tco2eValue', { value: total.toLocaleString() })}</div>
                            <Badge variant="secondary" className="text-xs">{ind.data_quality || 'estimated'}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ind)}>{t('esg.emissionsManager.editButton')}</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('esg.emissionsManager.noRecordsMessage')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('esg.emissionsManager.dialogTitle', { action: editingId ? t('esg.emissionsManager.editAction') : t('esg.emissionsManager.recordAction') })}</DialogTitle>
            <DialogDescription>{t('esg.emissionsManager.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('esg.emissionsManager.reportingYearLabel')}</Label>
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
                <Label>{t('esg.emissionsManager.dataQualityLabel')}</Label>
                <Select value={form.data_quality} onValueChange={v => setForm(f => ({ ...f, data_quality: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimated">{t('esg.emissionsManager.dataQualityEstimated')}</SelectItem>
                    <SelectItem value="measured">{t('esg.emissionsManager.dataQualityMeasured')}</SelectItem>
                    <SelectItem value="verified">{t('esg.emissionsManager.dataQualityVerified')}</SelectItem>
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
                    <span className="text-sm text-muted-foreground">{t('esg.emissionsManager.tonnesCo2eUnit')}</span>
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
                <Label>{t('esg.emissionsManager.energyConsumptionLabel')}</Label>
                <Input type="number" min={0} value={form.energy_consumption_kwh}
                  onChange={e => setForm(f => ({ ...f, energy_consumption_kwh: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('esg.emissionsManager.waterConsumptionLabel')}</Label>
                <Input type="number" min={0} value={form.water_consumption_m3}
                  onChange={e => setForm(f => ({ ...f, water_consumption_m3: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('esg.emissionsManager.wasteGeneratedLabel')}</Label>
                <Input type="number" min={0} value={form.waste_generated_tonnes}
                  onChange={e => setForm(f => ({ ...f, waste_generated_tonnes: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('esg.emissionsManager.renewableEnergyLabel')}</Label>
                <Input type="number" min={0} max={100} value={form.renewable_energy_percentage}
                  onChange={e => setForm(f => ({ ...f, renewable_energy_percentage: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t('esg.emissionsManager.communityInvestmentLabel')}</Label>
                <Input type="number" min={0} value={form.community_investment}
                  onChange={e => setForm(f => ({ ...f, community_investment: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>{t('esg.emissionsManager.cancelButton')}</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t('esg.emissionsManager.savingButton') : editingId ? t('esg.emissionsManager.updateButton') : t('esg.emissionsManager.saveButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
