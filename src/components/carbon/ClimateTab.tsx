import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Thermometer, Target, TrendingDown, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ClimateTabProps {
  reportId: string;
  isOwner: boolean;
}

interface DecarbEntry {
  id: string;
  baseline_emissions: number | null;
  target_emissions: number | null;
  reduction_strategy: string | null;
  target_year: number | null;
  methane_emissions_tco2e: number | null;
  methane_sector: string | null;
}

const METHANE_SECTORS = ["Agriculture", "Oil & Gas", "Waste", "Coal Mining", "Other"];

export default function ClimateTab({ reportId, isOwner }: ClimateTabProps) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<DecarbEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form
  const [baseline, setBaseline] = useState("");
  const [targetEm, setTargetEm] = useState("");
  const [strategy, setStrategy] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [methane, setMethane] = useState("");
  const [methaneSector, setMethaneSector] = useState("");

  useEffect(() => {
    fetchData();
  }, [reportId]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("project_decarbonisation")
      .select("*")
      .eq("report_id", reportId)
      .maybeSingle();
    if (data) {
      setEntry(data as any);
      setBaseline(data.baseline_emissions?.toString() || "");
      setTargetEm(data.target_emissions?.toString() || "");
      setStrategy(data.reduction_strategy || "");
      setTargetYear(data.target_year?.toString() || "");
      setMethane(data.methane_emissions_tco2e?.toString() || "");
      setMethaneSector(data.methane_sector || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const payload = {
      report_id: reportId,
      baseline_emissions: baseline ? parseFloat(baseline) : null,
      target_emissions: targetEm ? parseFloat(targetEm) : null,
      reduction_strategy: strategy || null,
      target_year: targetYear ? parseInt(targetYear) : null,
      methane_emissions_tco2e: methane ? parseFloat(methane) : null,
      methane_sector: methaneSector || null,
    };

    let error;
    if (entry) {
      ({ error } = await supabase.from("project_decarbonisation").update(payload as any).eq("id", entry.id));
    } else {
      ({ error } = await supabase.from("project_decarbonisation").insert(payload as any));
    }
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Decarbonisation plan saved");
    setEditing(false);
    fetchData();
  };

  const reductionPct = entry?.baseline_emissions && entry?.target_emissions
    ? Math.round(((entry.baseline_emissions - entry.target_emissions) / entry.baseline_emissions) * 100)
    : 0;

  const chartData = entry?.baseline_emissions ? [
    { name: "Baseline", emissions: entry.baseline_emissions },
    { name: "Target", emissions: entry.target_emissions || 0 },
  ] : [];

  const isHighMethane = (entry?.methane_emissions_tco2e || 0) > 100;

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Thermometer className="h-4 w-4" /> Baseline
            </div>
            <p className="text-2xl font-bold">{entry?.baseline_emissions?.toFixed(1) || "—"} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" /> Target
            </div>
            <p className="text-2xl font-bold">{entry?.target_emissions?.toFixed(1) || "—"} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
            {entry?.target_year && <p className="text-xs text-muted-foreground">by {entry.target_year}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" /> Reduction Target
            </div>
            <p className="text-2xl font-bold">{reductionPct}%</p>
            <Progress value={Math.min(reductionPct, 100)} className="h-2 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Methane Flag */}
      {isHighMethane && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">High Methane Emissions Detected</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">{entry?.methane_emissions_tco2e?.toFixed(1)} tCO₂e from {entry?.methane_sector || "unspecified sector"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Baseline vs Target Emissions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="emissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Form/Detail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Decarbonisation Plan</CardTitle>
            {isOwner && !editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{entry ? "Edit" : "Create Plan"}</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Baseline Emissions (tCO₂e)</Label><Input type="number" value={baseline} onChange={e => setBaseline(e.target.value)} /></div>
                <div><Label>Target Emissions (tCO₂e)</Label><Input type="number" value={targetEm} onChange={e => setTargetEm(e.target.value)} /></div>
              </div>
              <div><Label>Reduction Strategy</Label><Textarea value={strategy} onChange={e => setStrategy(e.target.value)} placeholder="Describe your decarbonisation strategy..." /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label>Target Year</Label><Input type="number" value={targetYear} onChange={e => setTargetYear(e.target.value)} placeholder="2030" /></div>
                <div><Label>Methane Emissions (tCO₂e)</Label><Input type="number" value={methane} onChange={e => setMethane(e.target.value)} /></div>
                <div>
                  <Label>Methane Sector</Label>
                  <Select value={methaneSector} onValueChange={setMethaneSector}>
                    <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                    <SelectContent>
                      {METHANE_SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Plan</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : entry ? (
            <div className="space-y-2 text-sm">
              {entry.reduction_strategy && <div><span className="font-medium">Strategy:</span> {entry.reduction_strategy}</div>}
              {entry.methane_emissions_tco2e && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Methane:</span> {entry.methane_emissions_tco2e.toFixed(1)} tCO₂e
                  {entry.methane_sector && <Badge variant="outline">{entry.methane_sector}</Badge>}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No decarbonisation plan created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
