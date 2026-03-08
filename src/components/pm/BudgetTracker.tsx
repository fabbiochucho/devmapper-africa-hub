import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { DollarSign, Plus, TrendingUp, Wallet } from "lucide-react";

interface BudgetTrackerProps {
  reportId: string;
  isOwner: boolean;
}

export default function BudgetTracker({ reportId, isOwner }: BudgetTrackerProps) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allocated, setAllocated] = useState("");
  const [spent, setSpent] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [source, setSource] = useState("");
  const [donor, setDonor] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { fetchBudgets(); }, [reportId]);

  const fetchBudgets = async () => {
    const { data } = await supabase.from("project_budgets").select("*").eq("report_id", reportId);
    if (data) setBudgets(data);
  };

  const totalAllocated = budgets.reduce((s, b) => s + Number(b.budget_allocated || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.budget_spent || 0), 0);
  const utilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const createBudget = async () => {
    if (!user) return;
    const { error } = await supabase.from("project_budgets").insert({
      report_id: reportId,
      budget_allocated: parseFloat(allocated) || 0,
      budget_spent: parseFloat(spent) || 0,
      currency,
      funding_source: source || null,
      donor_organization: donor || null,
      notes: notes || null,
      created_by: user.id,
    });
    if (error) toast.error("Failed to add budget entry");
    else {
      toast.success("Budget entry added");
      setDialogOpen(false);
      setAllocated(""); setSpent(""); setSource(""); setDonor(""); setNotes("");
      fetchBudgets();
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Allocated</p>
              <p className="text-lg font-bold">${totalAllocated.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10"><DollarSign className="h-5 w-5 text-orange-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-lg font-bold">${totalSpent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className="text-lg font-bold">{utilization}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Progress value={utilization} className="h-3" />

      {/* Budget entries */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Funding Sources</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {budgets.map((b: any) => (
              <div key={b.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{b.funding_source || "General"}</span>
                  <span className="text-sm">${Number(b.budget_allocated).toLocaleString()} {b.currency}</span>
                </div>
                {b.donor_organization && <p className="text-xs text-muted-foreground">Donor: {b.donor_organization}</p>}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent: ${Number(b.budget_spent).toLocaleString()}</span>
                  <span>{b.budget_allocated > 0 ? Math.round((b.budget_spent / b.budget_allocated) * 100) : 0}%</span>
                </div>
                <Progress value={b.budget_allocated > 0 ? (b.budget_spent / b.budget_allocated) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add budget dialog */}
      {isOwner && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Budget Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Budget / Funding Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Budget Allocated</Label><Input type="number" value={allocated} onChange={e => setAllocated(e.target.value)} placeholder="0" /></div>
                <div><Label>Budget Spent</Label><Input type="number" value={spent} onChange={e => setSpent(e.target.value)} placeholder="0" /></div>
              </div>
              <div><Label>Funding Source</Label><Input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. World Bank, AfDB, Government" /></div>
              <div><Label>Donor Organization</Label><Input value={donor} onChange={e => setDonor(e.target.value)} placeholder="Organization name" /></div>
              <div><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details" /></div>
              <Button onClick={createBudget} className="w-full">Add Budget Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
