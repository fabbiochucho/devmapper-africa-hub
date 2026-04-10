import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Calculator, Plus, Trash2, Info, AlertTriangle, CheckCircle, Flame, TrendingDown, Eye, FileText,
  Zap, Droplets, Truck, Factory, Leaf
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  ACTIVITY_CATEGORIES, DEFAULT_EMISSION_FACTORS,
  calculateEmissions, findEmissionFactor, assessDataQuality,
  validateActivityEntry,
  type ActivityEntry, type CalculationResult, type EmissionFactor
} from "@/lib/emission-factors";

const SCOPE_COLORS = { scope1: "#ef4444", scope2: "#f97316", scope3: "#eab308" };
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Energy: <Zap className="h-4 w-4" />,
  Transport: <Truck className="h-4 w-4" />,
  Waste: <Factory className="h-4 w-4" />,
  Water: <Droplets className="h-4 w-4" />,
  Agriculture: <Leaf className="h-4 w-4" />,
};

export default function CarbonCalculator() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [region, setRegion] = useState("Global");

  // Form state
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [activity, setActivity] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dataQuality, setDataQuality] = useState<'measured' | 'estimated' | 'default'>('estimated');
  const [period, setPeriod] = useState(new Date().getFullYear().toString());
  const [notes, setNotes] = useState("");

  const selectedCat = ACTIVITY_CATEGORIES.find(c => c.category === category);
  const selectedSub = selectedCat?.subcategories.find(s => s.name === subcategory);
  const matchedFactor = useMemo(() => {
    if (!category || !subcategory || !activity) return undefined;
    return findEmissionFactor(category, subcategory, activity, region);
  }, [category, subcategory, activity, region]);

  const liveCalc = useMemo(() => {
    if (!matchedFactor || !quantity || parseFloat(quantity) === 0) return null;
    return calculateEmissions(parseFloat(quantity), matchedFactor);
  }, [quantity, matchedFactor]);

  const addEntry = () => {
    if (!matchedFactor || !quantity) return;
    const validation = validateActivityEntry({ category, subcategory, activity, quantity: parseFloat(quantity), unit: matchedFactor.unit, dataQuality });
    if (!validation.valid) {
      validation.errors.forEach(e => toast.error(e.message));
      return;
    }
    validation.warnings.forEach(w => toast.warning(w.message));

    const calc = calculateEmissions(parseFloat(quantity), matchedFactor);
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      category, subcategory, activity,
      quantity: parseFloat(quantity),
      unit: matchedFactor.unit,
      emissionFactorId: matchedFactor.id,
      emissionFactor: matchedFactor.factor,
      emissions: calc.result.emissions,
      scope: matchedFactor.scope,
      period,
      dataQuality,
      confidenceScore: calc.confidence,
      notes,
    };
    setEntries(prev => [...prev, entry]);
    resetForm();
    toast.success(`Added: ${calc.result.emissions.toFixed(3)} tCO₂e from ${activity}`);
  };

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  const resetForm = () => {
    setShowForm(false);
    setCategory(""); setSubcategory(""); setActivity("");
    setQuantity(""); setNotes("");
  };

  // Aggregations
  const totalEmissions = entries.reduce((s, e) => s + e.emissions, 0);
  const scope1 = entries.filter(e => e.scope === 'scope1').reduce((s, e) => s + e.emissions, 0);
  const scope2 = entries.filter(e => e.scope === 'scope2').reduce((s, e) => s + e.emissions, 0);
  const scope3 = entries.filter(e => e.scope === 'scope3').reduce((s, e) => s + e.emissions, 0);
  const dataQualityAssessment = assessDataQuality(entries);

  const scopeData = [
    { name: "Scope 1", value: scope1, color: SCOPE_COLORS.scope1 },
    { name: "Scope 2", value: scope2, color: SCOPE_COLORS.scope2 },
    { name: "Scope 3", value: scope3, color: SCOPE_COLORS.scope3 },
  ].filter(d => d.value !== 0);

  const categoryData = ACTIVITY_CATEGORIES.map(c => ({
    name: c.category,
    value: entries.filter(e => e.category === c.category).reduce((s, e) => s + e.emissions, 0),
  })).filter(d => d.value !== 0);

  // Top emission hotspots
  const hotspots = [...entries].sort((a, b) => b.emissions - a.emissions).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Carbon Calculator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Transparent, auditable emissions calculations • GHG Protocol aligned
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Global", "Nigeria", "Kenya", "South Africa", "Ghana", "Egypt"].map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />{showForm ? "Cancel" : "Add Activity"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Flame className="h-4 w-4" />Total</div>
            <p className="text-2xl font-bold">{totalEmissions.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span></p>
          </CardContent>
        </Card>
        {[{ label: "Scope 1", value: scope1, color: "text-red-500" }, { label: "Scope 2", value: scope2, color: "text-orange-500" }, { label: "Scope 3", value: scope3, color: "text-yellow-600" }].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Data Quality</p>
            <p className="text-xl font-bold">{dataQualityAssessment.overallScore}%</p>
            <Progress value={dataQualityAssessment.overallScore} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Add Activity Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Add Activity Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={v => { setCategory(v); setSubcategory(""); setActivity(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_CATEGORIES.map(c => (
                      <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Select value={subcategory} onValueChange={v => { setSubcategory(v); setActivity(""); }} disabled={!category}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {selectedCat?.subcategories.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Activity</Label>
                <Select value={activity} onValueChange={setActivity} disabled={!subcategory}>
                  <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                  <SelectContent>
                    {selectedSub?.activities.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Quantity ({matchedFactor?.unit || selectedSub?.defaultUnit || 'units'})</Label>
                <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Data Quality</Label>
                <Select value={dataQuality} onValueChange={v => setDataQuality(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="measured">Measured (actual data)</SelectItem>
                    <SelectItem value="estimated">Estimated</SelectItem>
                    <SelectItem value="default">Default factor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reporting Period</Label>
                <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2024" />
              </div>
            </div>

            {/* Live Calculation Preview (Transparent) */}
            {liveCalc && (
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Eye className="h-4 w-4 text-primary" /> Calculation Preview (Transparent)
                  </div>
                  <div className="font-mono text-xs space-y-1 bg-background p-3 rounded">
                    <p><span className="text-muted-foreground">Input:</span> {liveCalc.input.quantity.toLocaleString()} {liveCalc.input.unit}</p>
                    <p><span className="text-muted-foreground">Factor:</span> {liveCalc.emissionFactor.value} kgCO₂e/{liveCalc.input.unit}</p>
                    <p><span className="text-muted-foreground">Source:</span> {liveCalc.emissionFactor.source} ({liveCalc.emissionFactor.region}, {liveCalc.emissionFactor.year})</p>
                    <Separator className="my-1" />
                    <p className="font-bold">{liveCalc.formula}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant={liveCalc.confidence >= 80 ? "default" : liveCalc.confidence >= 50 ? "secondary" : "destructive"}>
                      Confidence: {liveCalc.confidence}%
                    </Badge>
                    <span className="text-muted-foreground">Methodology: {liveCalc.methodology}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {matchedFactor && !quantity && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Factor: {matchedFactor.factor} kgCO₂e/{matchedFactor.unit} — Source: {matchedFactor.source} ({matchedFactor.region})
              </p>
            )}

            {!matchedFactor && activity && (
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> No emission factor found for this activity in "{region}". Try "Global" region.
              </p>
            )}

            <Button onClick={addEntry} disabled={!matchedFactor || !quantity || parseFloat(quantity) === 0}>
              <Plus className="h-4 w-4 mr-2" />Add to Calculation
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries">Entries ({entries.length})</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="factors">Emission Factors</TabsTrigger>
        </TabsList>

        {/* Entries Table (Structured Excel-like View) */}
        <TabsContent value="entries">
          <Card>
            <CardContent className="pt-4">
              {entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Emissions (tCO₂e)</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="flex items-center gap-2">
                          {CATEGORY_ICONS[e.category] || <Factory className="h-4 w-4" />}
                          {e.category}
                        </TableCell>
                        <TableCell>{e.activity}</TableCell>
                        <TableCell>{e.quantity.toLocaleString()} {e.unit}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{e.scope.replace('scope', 'Scope ')}</Badge></TableCell>
                        <TableCell className="font-mono font-bold">{e.emissions.toFixed(4)}</TableCell>
                        <TableCell>
                          <Badge variant={e.dataQuality === 'measured' ? 'default' : 'secondary'} className="text-xs">
                            {e.dataQuality}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setShowDetails(showDetails === e.id ? null : e.id)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeEntry(e.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No activity data yet. Click "Add Activity" to start calculating.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expanded detail */}
          {showDetails && entries.find(e => e.id === showDetails) && (() => {
            const entry = entries.find(e => e.id === showDetails)!;
            const factor = DEFAULT_EMISSION_FACTORS.find(f => f.id === entry.emissionFactorId);
            return (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-4 font-mono text-xs space-y-1">
                  <p className="font-bold text-sm mb-2">Calculation Audit Trail</p>
                  <p>Activity: {entry.activity} ({entry.category} → {entry.subcategory})</p>
                  <p>Input: {entry.quantity.toLocaleString()} {entry.unit}</p>
                  <p>Emission Factor: {entry.emissionFactor} kgCO₂e/{entry.unit}</p>
                  <p>Source: {factor?.source || 'N/A'} | Region: {factor?.region || 'N/A'} | Year: {factor?.year || 'N/A'}</p>
                  <Separator />
                  <p className="font-bold">Formula: {entry.quantity.toLocaleString()} × {entry.emissionFactor} ÷ 1000 = {entry.emissions.toFixed(4)} tCO₂e</p>
                  <p>Confidence: {entry.confidenceScore}% | Data Quality: {entry.dataQuality} | Period: {entry.period}</p>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* Charts Breakdown */}
        <TabsContent value="breakdown">
          {entries.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">By Scope</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={scopeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {scopeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(val: number) => `${val.toFixed(3)} tCO₂e`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis />
                      <Tooltip formatter={(val: number) => `${val.toFixed(3)} tCO₂e`} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Add entries to see breakdown charts</CardContent></Card>
          )}
        </TabsContent>

        {/* Hotspots */}
        <TabsContent value="hotspots">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4" />Emission Hotspots & Reduction Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {hotspots.length > 0 ? (
                <div className="space-y-3">
                  {hotspots.map((h, i) => (
                    <div key={h.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-medium">{h.activity}</p>
                        <p className="text-xs text-muted-foreground">{h.category} • {h.quantity.toLocaleString()} {h.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{h.emissions.toFixed(3)} tCO₂e</p>
                        <p className="text-xs text-muted-foreground">{totalEmissions > 0 ? ((h.emissions / totalEmissions) * 100).toFixed(1) : 0}% of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Add entries to see hotspots</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Quality */}
        <TabsContent value="quality">
          <Card>
            <CardHeader><CardTitle className="text-sm">Data Quality Assessment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Completeness", value: dataQualityAssessment.completeness },
                  { label: "Accuracy", value: dataQualityAssessment.accuracy },
                  { label: "Consistency", value: dataQualityAssessment.consistency },
                  { label: "Timeliness", value: dataQualityAssessment.timeliness },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-bold text-lg">{m.value.toFixed(0)}%</p>
                    <Progress value={m.value} className="h-1.5 mt-1" />
                  </div>
                ))}
              </div>
              {dataQualityAssessment.issues.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-yellow-500" />Issues</p>
                  <ul className="space-y-1">
                    {dataQualityAssessment.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dataQualityAssessment.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><CheckCircle className="h-4 w-4 text-primary" />Suggestions</p>
                  <ul className="space-y-1">
                    {dataQualityAssessment.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emission Factor Database */}
        <TabsContent value="factors">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Emission Factor Database</CardTitle>
              <CardDescription>{DEFAULT_EMISSION_FACTORS.length} factors • GHG Protocol / DEFRA / IPCC sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Factor</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEFAULT_EMISSION_FACTORS.map(ef => (
                      <TableRow key={ef.id}>
                        <TableCell className="text-xs">{ef.category}</TableCell>
                        <TableCell className="text-xs font-medium">{ef.activity}</TableCell>
                        <TableCell className="font-mono text-xs">{ef.factor}</TableCell>
                        <TableCell className="text-xs">kgCO₂e/{ef.unit}</TableCell>
                        <TableCell className="text-xs">{ef.region}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ef.source}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{ef.scope}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={ef.confidence === 'high' ? 'default' : ef.confidence === 'medium' ? 'secondary' : 'destructive'} className="text-xs">
                            {ef.confidence}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
