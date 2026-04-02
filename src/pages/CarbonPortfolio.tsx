import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Briefcase, Plus, TrendingUp, Leaf, DollarSign, Target } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CarbonPortfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", target_tonnes: "", budget_usd: "", risk_level: "medium", impact_focus: "" });

  const { data: portfolios, isLoading } = useQuery({
    queryKey: ["carbon-portfolios", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("carbon_portfolios").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: holdings } = useQuery({
    queryKey: ["portfolio-holdings", user?.id],
    queryFn: async () => {
      if (!user || !portfolios?.length) return [];
      const ids = portfolios.map(p => p.id);
      const { data } = await supabase.from("portfolio_holdings").select("*, marketplace_listings(title, project_type, price_per_tonne)").in("portfolio_id", ids);
      return data || [];
    },
    enabled: !!user && !!portfolios?.length,
  });

  const createPortfolio = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("carbon_portfolios").insert({
        user_id: user.id,
        name: form.name,
        description: form.description || null,
        target_tonnes: form.target_tonnes ? parseFloat(form.target_tonnes) : null,
        budget_usd: form.budget_usd ? parseFloat(form.budget_usd) : null,
        risk_level: form.risk_level as any,
        impact_focus: form.impact_focus ? form.impact_focus.split(",").map(s => s.trim()) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Portfolio created!");
      setShowCreate(false);
      setForm({ name: "", description: "", target_tonnes: "", budget_usd: "", risk_level: "medium", impact_focus: "" });
      queryClient.invalidateQueries({ queryKey: ["carbon-portfolios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalTonnes = holdings?.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0) || 0;
  const totalValue = holdings?.reduce((sum, h) => sum + (Number(h.current_value) || Number(h.purchase_price) || 0), 0) || 0;
  const retiredTonnes = holdings?.filter(h => h.status === "retired").reduce((sum, h) => sum + (Number(h.quantity) || 0), 0) || 0;

  // Pie chart data by project type
  const typeBreakdown = holdings?.reduce((acc: any[], h: any) => {
    const type = h.marketplace_listings?.project_type || "other";
    const existing = acc.find(a => a.name === type);
    if (existing) existing.value += Number(h.quantity) || 0;
    else acc.push({ name: type, value: Number(h.quantity) || 0 });
    return acc;
  }, []) || [];

  if (!user) return <div className="container mx-auto p-6 text-center text-muted-foreground">Please sign in to view portfolios</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead title="Carbon Portfolio - DevMapper" description="Manage your diversified carbon credit portfolio." />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Carbon Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">Track your carbon credit investments and impact</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Portfolio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Portfolio</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Portfolio Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Target (tCO2e)" value={form.target_tonnes} onChange={e => setForm(p => ({ ...p, target_tonnes: e.target.value }))} />
                <Input type="number" placeholder="Budget (USD)" value={form.budget_usd} onChange={e => setForm(p => ({ ...p, budget_usd: e.target.value }))} />
              </div>
              <Select value={form.risk_level} onValueChange={v => setForm(p => ({ ...p, risk_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Impact Focus (comma-separated)" value={form.impact_focus} onChange={e => setForm(p => ({ ...p, impact_focus: e.target.value }))} />
              <Button onClick={() => createPortfolio.mutate()} disabled={!form.name || createPortfolio.isPending} className="w-full">
                {createPortfolio.isPending ? "Creating..." : "Create Portfolio"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10"><Leaf className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">{totalTonnes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">tCO2e</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10"><Target className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Retired</p>
                <p className="text-2xl font-bold">{retiredTonnes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">tCO2e</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10"><Briefcase className="h-5 w-5 text-purple-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Portfolios</p>
                <p className="text-2xl font-bold">{portfolios?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {typeBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Portfolio Allocation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Credits by Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading portfolios...</div>
      ) : portfolios && portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolios.map(p => {
            const pHoldings = holdings?.filter(h => h.portfolio_id === p.id) || [];
            const pTonnes = pHoldings.reduce((s, h) => s + (Number(h.quantity) || 0), 0);
            const progress = p.target_tonnes ? (pTonnes / Number(p.target_tonnes)) * 100 : 0;
            return (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{p.name}</CardTitle>
                      {p.description && <CardDescription>{p.description}</CardDescription>}
                    </div>
                    <Badge variant={p.risk_level === "low" ? "default" : p.risk_level === "high" ? "destructive" : "secondary"}>
                      {p.risk_level} risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Credits:</span> <span className="font-medium">{pTonnes} tCO2e</span></div>
                    <div><span className="text-muted-foreground">Holdings:</span> <span className="font-medium">{pHoldings.length}</span></div>
                    {p.budget_usd && <div><span className="text-muted-foreground">Budget:</span> <span className="font-medium">${Number(p.budget_usd).toLocaleString()}</span></div>}
                    {p.target_tonnes && <div><span className="text-muted-foreground">Target:</span> <span className="font-medium">{Number(p.target_tonnes).toLocaleString()} tCO2e</span></div>}
                  </div>
                  {p.target_tonnes && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{Math.min(progress, 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No portfolios yet</p>
            <p className="text-sm">Create a portfolio to start tracking your carbon credit investments</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarbonPortfolio;
