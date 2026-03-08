import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Plus, Activity, Target } from "lucide-react";

interface ImpactIndicatorsProps {
  reportId: string;
  isOwner: boolean;
}

export default function ImpactIndicators({ reportId, isOwner }: ImpactIndicatorsProps) {
  const { user } = useAuth();
  const [indicators, setIndicators] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [baseline, setBaseline] = useState("");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [sdgGoal, setSdgGoal] = useState("");

  useEffect(() => { fetchIndicators(); }, [reportId]);

  const fetchIndicators = async () => {
    const { data } = await supabase.from("project_indicators").select("*").eq("report_id", reportId);
    if (data) setIndicators(data);
  };

  const createIndicator = async () => {
    if (!name.trim() || !user) return;
    const { error } = await supabase.from("project_indicators").insert({
      report_id: reportId,
      indicator_name: name,
      baseline_value: parseFloat(baseline) || 0,
      current_value: parseFloat(current) || 0,
      target_value: target ? parseFloat(target) : null,
      unit: unit || null,
      sdg_goal: sdgGoal ? parseInt(sdgGoal) : null,
      created_by: user.id,
    });
    if (error) toast.error("Failed to add indicator");
    else {
      toast.success("Indicator added");
      setDialogOpen(false);
      setName(""); setBaseline(""); setCurrent(""); setTarget(""); setUnit(""); setSdgGoal("");
      fetchIndicators();
    }
  };

  const updateIndicatorValue = async (id: string, newValue: number) => {
    await supabase.from("project_indicators").update({ current_value: newValue }).eq("id", id);
    fetchIndicators();
  };

  return (
    <div className="space-y-4">
      {indicators.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No impact indicators yet.</p>
            <p className="text-sm text-muted-foreground">Track project outcomes against SDG targets.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indicators.map((ind: any) => {
            const pct = ind.target_value ? Math.min(Math.round(((ind.current_value - ind.baseline_value) / (ind.target_value - ind.baseline_value)) * 100), 100) : 0;
            return (
              <Card key={ind.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{ind.indicator_name}</p>
                    {ind.sdg_goal && <Badge variant="secondary"><Target className="h-3 w-3 mr-1" />SDG {ind.sdg_goal}</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Baseline</p>
                      <p className="font-bold">{ind.baseline_value}{ind.unit ? ` ${ind.unit}` : ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-bold text-primary">{ind.current_value}{ind.unit ? ` ${ind.unit}` : ""}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-bold">{ind.target_value ?? "—"}{ind.unit ? ` ${ind.unit}` : ""}</p>
                    </div>
                  </div>
                  {ind.target_value && (
                    <>
                      <Progress value={Math.max(pct, 0)} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{pct}% toward target</p>
                    </>
                  )}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="h-7 text-xs"
                        placeholder="Update current value"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            updateIndicatorValue(ind.id, parseFloat((e.target as HTMLInputElement).value));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isOwner && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Indicator</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Impact Indicator</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Indicator Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Households with electricity" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Baseline</Label><Input type="number" value={baseline} onChange={e => setBaseline(e.target.value)} placeholder="0" /></div>
                <div><Label>Current</Label><Input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0" /></div>
                <div><Label>Target</Label><Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Optional" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Unit</Label><Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. %, tons, kWh" /></div>
                <div>
                  <Label>SDG Goal</Label>
                  <Select value={sdgGoal} onValueChange={setSdgGoal}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 17 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>SDG {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createIndicator} className="w-full">Add Indicator</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
