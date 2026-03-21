import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DollarSign, TrendingUp, PiggyBank, Percent, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface FinancialImpactTabProps {
  reportId: string;
  isOwner: boolean;
  projectCost?: number | null;
}

interface FinancialImpact {
  id: string;
  operational_cost_savings: number | null;
  revenue_generated: number | null;
  carbon_credit_value: number | null;
  efficiency_gains_pct: number | null;
  roi_percentage: number | null;
  notes: string | null;
}

export default function FinancialImpactTab({ reportId, isOwner, projectCost }: FinancialImpactTabProps) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<FinancialImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [savings, setSavings] = useState("");
  const [revenue, setRevenue] = useState("");
  const [creditValue, setCreditValue] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { fetchData(); }, [reportId]);

  const fetchData = async () => {
    // Also auto-calculate carbon credit value from carbon_assets
    const [finResult, assetResult] = await Promise.all([
      supabase.from("project_financial_impact").select("*").eq("report_id", reportId).maybeSingle(),
      supabase.from("carbon_assets").select("estimated_value_usd").eq("report_id", reportId).maybeSingle(),
    ]);

    const autoCredit = assetResult.data?.estimated_value_usd || 0;

    if (finResult.data) {
      const d = finResult.data as any;
      setEntry(d);
      setSavings(d.operational_cost_savings?.toString() || "");
      setRevenue(d.revenue_generated?.toString() || "");
      setCreditValue(d.carbon_credit_value?.toString() || autoCredit.toString());
      setEfficiency(d.efficiency_gains_pct?.toString() || "");
      setNotes(d.notes || "");
    } else if (autoCredit > 0) {
      setCreditValue(autoCredit.toString());
    }
    setLoading(false);
  };

  const calcROI = (): number => {
    const s = parseFloat(savings) || 0;
    const r = parseFloat(revenue) || 0;
    const cost = projectCost || 0;
    if (cost <= 0) return 0;
    return Math.round(((s + r - cost) / cost) * 100);
  };

  const handleSave = async () => {
    if (!user) return;
    const roi = calcROI();
    const payload = {
      report_id: reportId,
      operational_cost_savings: savings ? parseFloat(savings) : null,
      revenue_generated: revenue ? parseFloat(revenue) : null,
      carbon_credit_value: creditValue ? parseFloat(creditValue) : null,
      efficiency_gains_pct: efficiency ? parseFloat(efficiency) : null,
      roi_percentage: roi,
      notes: notes || null,
    };

    let error;
    if (entry) {
      ({ error } = await supabase.from("project_financial_impact").update(payload as any).eq("id", entry.id));
    } else {
      ({ error } = await supabase.from("project_financial_impact").insert(payload as any));
    }
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Financial impact saved");
    setEditing(false);
    fetchData();
  };

  const roi = entry?.roi_percentage || calcROI();
  const totalReturns = (entry?.operational_cost_savings || 0) + (entry?.revenue_generated || 0) + (entry?.carbon_credit_value || 0);

  const chartData = [
    { name: "Cost Savings", value: entry?.operational_cost_savings || 0 },
    { name: "Revenue", value: entry?.revenue_generated || 0 },
    { name: "Carbon Credits", value: entry?.carbon_credit_value || 0 },
  ].filter(d => d.value > 0);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Sustainability ROI</div>
            <p className="text-2xl font-bold">{roi}%</p>
            <Badge variant={roi > 0 ? "default" : "outline"} className="mt-1">
              {roi > 0 ? "Positive" : roi === 0 ? "Neutral" : "Negative"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><PiggyBank className="h-4 w-4" /> Cost Savings</div>
            <p className="text-2xl font-bold">${(entry?.operational_cost_savings || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="h-4 w-4" /> Total Returns</div>
            <p className="text-2xl font-bold">${totalReturns.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Percent className="h-4 w-4" /> Efficiency Gains</div>
            <p className="text-2xl font-bold">{entry?.efficiency_gains_pct || "—"}%</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Financial Returns Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Financial Impact Data</CardTitle>
            {isOwner && !editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{entry ? "Edit" : "Add Data"}</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Operational Cost Savings ($)</Label><Input type="number" value={savings} onChange={e => setSavings(e.target.value)} /></div>
                <div><Label>Revenue Generated ($)</Label><Input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Carbon Credit Value ($)</Label><Input type="number" value={creditValue} onChange={e => setCreditValue(e.target.value)} /></div>
                <div><Label>Efficiency Gains (%)</Label><Input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} min="0" max="100" /></div>
              </div>
              {projectCost && projectCost > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="font-medium">Auto-calculated ROI:</span> {calcROI()}%
                  <span className="text-muted-foreground ml-2">(Savings + Revenue - Cost) / Cost × 100</span>
                </div>
              )}
              <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context..." /></div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : entry ? (
            <div className="space-y-2 text-sm">
              {entry.notes && <p className="text-muted-foreground">{entry.notes}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No financial impact data recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
