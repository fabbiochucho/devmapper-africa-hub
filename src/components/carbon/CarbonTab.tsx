import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Flame, ShieldCheck, Plus, Trash2, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CarbonTabProps {
  reportId: string;
  isOwner: boolean;
}

interface CarbonEntry {
  id: string;
  emission_source: string | null;
  scope_types: string[] | null;
  estimated_emissions_tco2e: number | null;
  reporting_period_start: string | null;
  reporting_period_end: string | null;
  funding_source: string | null;
  estimated_savings: number | null;
  carbon_verified: boolean;
  evidence_url: string | null;
  created_at: string;
}

const EMISSION_SOURCES = ["Energy", "Transport", "Agriculture", "Waste", "Industrial"];
const SCOPE_TYPES = ["Scope 1", "Scope 2", "Scope 3"];
const FUNDING_SOURCES = ["Government", "Donor", "Corporate", "Self-funded"];
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b"];

export default function CarbonTab({ reportId, isOwner }: CarbonTabProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [emissionSource, setEmissionSource] = useState("");
  const [scopeTypes, setScopeTypes] = useState<string[]>([]);
  const [emissions, setEmissions] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [savings, setSavings] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  useEffect(() => {
    fetchEntries();
  }, [reportId]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("project_carbon_data")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data as any);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const { error } = await supabase.from("project_carbon_data").insert({
      report_id: reportId,
      emission_source: emissionSource || null,
      scope_types: scopeTypes.length > 0 ? scopeTypes : null,
      estimated_emissions_tco2e: emissions ? parseFloat(emissions) : null,
      reporting_period_start: periodStart || null,
      reporting_period_end: periodEnd || null,
      funding_source: fundingSource || null,
      estimated_savings: savings ? parseFloat(savings) : null,
      evidence_url: evidenceUrl || null,
    } as any);
    if (error) { toast.error("Failed to save carbon data"); return; }
    toast.success("Carbon data saved");
    resetForm();
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("project_carbon_data").delete().eq("id", id);
    toast.success("Entry deleted");
    fetchEntries();
  };

  const resetForm = () => {
    setShowForm(false);
    setEmissionSource("");
    setScopeTypes([]);
    setEmissions("");
    setPeriodStart("");
    setPeriodEnd("");
    setFundingSource("");
    setSavings("");
    setEvidenceUrl("");
  };

  const totalEmissions = entries.reduce((s, e) => s + (e.estimated_emissions_tco2e || 0), 0);
  const totalSavings = entries.reduce((s, e) => s + (e.estimated_savings || 0), 0);
  const verifiedCount = entries.filter(e => e.carbon_verified).length;

  const bySource = EMISSION_SOURCES.map(src => ({
    name: src,
    value: entries.filter(e => e.emission_source === src).reduce((s, e) => s + (e.estimated_emissions_tco2e || 0), 0),
  })).filter(d => d.value > 0);

  const byScope = SCOPE_TYPES.map(scope => ({
    name: scope,
    value: entries.filter(e => e.scope_types?.includes(scope)).reduce((s, e) => s + (e.estimated_emissions_tco2e || 0), 0),
  })).filter(d => d.value > 0);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Flame className="h-4 w-4" /> Total Emissions
            </div>
            <p className="text-2xl font-bold">{totalEmissions.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" /> Est. Cost Savings
            </div>
            <p className="text-2xl font-bold">${totalSavings.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShieldCheck className="h-4 w-4" /> Verification
            </div>
            <p className="text-2xl font-bold">{verifiedCount}/{entries.length} <span className="text-sm font-normal text-muted-foreground">verified</span></p>
            {entries.length > 0 && !entries.some(e => e.carbon_verified) && (
              <Badge variant="outline" className="mt-1 text-yellow-600 border-yellow-400">⚠ Unverified</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bySource.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Emissions by Source</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bySource}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {byScope.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Emissions by Scope</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byScope} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byScope.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Carbon Data Entries ({entries.length})</CardTitle>
            {isOwner && (
              <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4 mr-1" />{showForm ? "Cancel" : "Add Entry"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Emission Source</Label>
                  <Select value={emissionSource} onValueChange={setEmissionSource}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {EMISSION_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Emissions (tCO₂e)</Label>
                  <Input type="number" value={emissions} onChange={e => setEmissions(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Scope Types</Label>
                <div className="flex gap-4 mt-1">
                  {SCOPE_TYPES.map(scope => (
                    <label key={scope} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={scopeTypes.includes(scope)}
                        onCheckedChange={(checked) => {
                          setScopeTypes(prev => checked ? [...prev, scope] : prev.filter(s => s !== scope));
                        }}
                      />
                      {scope}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Reporting Period Start</Label>
                  <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <Label>Reporting Period End</Label>
                  <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Funding Source</Label>
                  <Select value={fundingSource} onValueChange={setFundingSource}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {FUNDING_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Cost Savings ($)</Label>
                  <Input type="number" value={savings} onChange={e => setSavings(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Evidence URL</Label>
                <Input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={handleSubmit} disabled={!emissions}>Save Carbon Data</Button>
            </div>
          )}

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No carbon data recorded yet.</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.emission_source && <Badge variant="secondary">{entry.emission_source}</Badge>}
                    {entry.scope_types?.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    {entry.carbon_verified ? (
                      <Badge className="bg-green-600 text-white text-xs">✔ Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-xs">⚠ Unverified</Badge>
                    )}
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Emissions:</span> {entry.estimated_emissions_tco2e?.toFixed(1) || "—"} tCO₂e</div>
                  {entry.funding_source && <div><span className="text-muted-foreground">Funding:</span> {entry.funding_source}</div>}
                  {entry.estimated_savings && <div><span className="text-muted-foreground">Savings:</span> ${entry.estimated_savings.toLocaleString()}</div>}
                  {entry.reporting_period_start && <div><span className="text-muted-foreground">Period:</span> {entry.reporting_period_start} → {entry.reporting_period_end}</div>}
                </div>
                {entry.evidence_url && (
                  <a href={entry.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View evidence</a>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
