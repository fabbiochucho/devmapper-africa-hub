import { useState, useEffect, useCallback } from "react";
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
import { useTranslation } from "react-i18next";
import { Flame, ShieldCheck, Plus, Trash2, TrendingDown, Calculator, BookText, Upload, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CarbonTabProps {
  reportId: string;
  isOwner: boolean;
}

interface EmissionFactor {
  id: string;
  category: string;
  activity: string;
  region: string;
  unit: string;
  factor_kgco2e: number;
  scope: number;
  source: string;
  source_year: number;
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
  activity_quantity: number | null;
  activity_unit: string | null;
  emission_factor_id: string | null;
  calculation_method: string;
  emission_factors: { activity: string; source: string; source_year: number; region: string } | null;
}

const EMISSION_SOURCES = ["Energy", "Transport", "Agriculture", "Waste", "Industrial"];
const SCOPE_TYPES = ["Scope 1", "Scope 2", "Scope 3"];
const FUNDING_SOURCES = ["Government", "Donor", "Corporate", "Self-funded"];
// --secondary/--accent are near-white surface tokens, so they made pie slices invisible.
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "#8b5cf6", "#ef4444"];

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  electricity: "carbon.categoryElectricity",
  stationary_combustion: "carbon.categoryStationaryCombustion",
  mobile_combustion: "carbon.categoryMobileCombustion",
  fugitive: "carbon.categoryFugitive",
  heat_steam: "carbon.categoryHeatSteam",
  cat1_purchased_goods: "carbon.categoryPurchasedGoods",
  cat3_fuel_energy: "carbon.categoryFuelEnergy",
  cat4_upstream_transport: "carbon.categoryUpstreamTransport",
  cat5_waste: "carbon.categoryWasteGenerated",
  cat6_business_travel: "carbon.categoryBusinessTravel",
  cat7_employee_commute: "carbon.categoryEmployeeCommuting",
  cat9_downstream_transport: "carbon.categoryDownstreamTransport",
  cat2_capital_goods: "carbon.categoryCapitalGoods",
  cat12_end_of_life: "carbon.categoryEndOfLife",
  electricity_lifecycle_estimate: "carbon.categoryElectricityLifecycle",
};

const SCOPE_LABELS: Record<number, string> = { 1: "Scope 1", 2: "Scope 2", 3: "Scope 3" };

const CATEGORY_TO_EMISSION_SOURCE: Record<string, string> = {
  electricity: "Energy", heat_steam: "Energy", stationary_combustion: "Energy",
  mobile_combustion: "Transport", cat4_upstream_transport: "Transport", cat6_business_travel: "Transport", cat7_employee_commute: "Transport", cat9_downstream_transport: "Transport",
  cat5_waste: "Waste", fugitive: "Industrial", cat1_purchased_goods: "Industrial", cat3_fuel_energy: "Energy",
  cat2_capital_goods: "Industrial", cat12_end_of_life: "Waste", electricity_lifecycle_estimate: "Energy",
};

export default function CarbonTab({ reportId, isOwner }: CarbonTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);

  // Form state
  const [calcMethod, setCalcMethod] = useState<"activity_based" | "manual_entry">("activity_based");
  const [category, setCategory] = useState("");
  const [factorId, setFactorId] = useState("");
  const [activityQuantity, setActivityQuantity] = useState("");
  const [emissionSource, setEmissionSource] = useState("");
  const [scopeTypes, setScopeTypes] = useState<string[]>([]);
  const [emissions, setEmissions] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [savings, setSavings] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  // Upload-a-bill extraction (§31)
  const [extracting, setExtracting] = useState(false);
  const [billResult, setBillResult] = useState<{
    activity_type: string; quantity: number | null; unit: string | null;
    vendor: string | null; billing_period: string | null; confidence: string;
  } | null>(null);

  const fetchFactors = async () => {
    const { data } = await supabase
      .from("emission_factors")
      .select("id, category, activity, region, unit, factor_kgco2e, scope, source, source_year")
      .order("category")
      .order("activity");
    if (data) setFactors(data as EmissionFactor[]);
  };

  const selectedFactor = factors.find(f => f.id === factorId) || null;
  const computedEmissions = selectedFactor && activityQuantity
    ? (parseFloat(activityQuantity) * selectedFactor.factor_kgco2e) / 1000
    : null;

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("project_carbon_data")
      .select("*, emission_factors(activity, source, source_year, region)")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data as any);
    setLoading(false);
  }, [reportId]);

  useEffect(() => {
    fetchEntries();
    fetchFactors();
  }, [fetchEntries, reportId]);

  const handleSubmit = async () => {
    if (!user) return;
    const isActivityBased = calcMethod === "activity_based" && selectedFactor && activityQuantity;
    if (calcMethod === "activity_based" && !isActivityBased) {
      toast.error(t("carbon.selectActivityAndQuantity"));
      return;
    }
    const { error } = await supabase.from("project_carbon_data").insert({
      report_id: reportId,
      emission_source: isActivityBased ? (CATEGORY_TO_EMISSION_SOURCE[category] || null) : (emissionSource || null),
      scope_types: isActivityBased ? [SCOPE_LABELS[selectedFactor!.scope]] : (scopeTypes.length > 0 ? scopeTypes : null),
      estimated_emissions_tco2e: isActivityBased ? computedEmissions : (emissions ? parseFloat(emissions) : null),
      reporting_period_start: periodStart || null,
      reporting_period_end: periodEnd || null,
      funding_source: fundingSource || null,
      estimated_savings: savings ? parseFloat(savings) : null,
      evidence_url: evidenceUrl || null,
      calculation_method: isActivityBased ? "activity_based" : "manual_entry",
      activity_quantity: isActivityBased ? parseFloat(activityQuantity) : null,
      activity_unit: isActivityBased ? selectedFactor!.unit : null,
      emission_factor_id: isActivityBased ? selectedFactor!.id : null,
    } as any);
    if (error) { toast.error(t("carbon.failedToSaveCarbonData")); return; }
    toast.success(t("carbon.carbonDataSaved"));
    resetForm();
    fetchEntries();
  };

  const handleBillUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("carbon.imageTooLarge"));
      return;
    }
    setExtracting(true);
    setBillResult(null);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("extract-bill-data", { body: { imageDataUrl } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBillResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("carbon.failedToReadBill"));
    } finally {
      setExtracting(false);
    }
  };

  const applyBillResult = () => {
    if (!billResult) return;
    if (billResult.activity_type === "electricity" && factors.some(f => f.category === "electricity")) {
      setCategory("electricity");
    }
    if (billResult.quantity != null) {
      setActivityQuantity(String(billResult.quantity));
    }
    toast.info(t("carbon.quantityFilledIn"));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("project_carbon_data").delete().eq("id", id);
    toast.success(t("carbon.entryDeleted"));
    fetchEntries();
  };

  const resetForm = () => {
    setShowForm(false);
    setCalcMethod("activity_based");
    setCategory("");
    setFactorId("");
    setActivityQuantity("");
    setEmissionSource("");
    setScopeTypes([]);
    setEmissions("");
    setPeriodStart("");
    setPeriodEnd("");
    setFundingSource("");
    setSavings("");
    setEvidenceUrl("");
    setBillResult(null);
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
              <Flame className="h-4 w-4" /> {t("carbon.totalEmissions")}
            </div>
            <p className="text-2xl font-bold">{totalEmissions.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" /> {t("carbon.estCostSavings")}
            </div>
            <p className="text-2xl font-bold">${totalSavings.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShieldCheck className="h-4 w-4" /> {t("carbon.verification")}
            </div>
            <p className="text-2xl font-bold">{verifiedCount}/{entries.length} <span className="text-sm font-normal text-muted-foreground">{t("carbon.verified")}</span></p>
            {entries.length > 0 && !entries.some(e => e.carbon_verified) && (
              <Badge variant="outline" className="mt-1 text-yellow-600 border-yellow-400">{t("carbon.unverifiedBadge")}</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bySource.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("carbon.emissionsBySource")}</CardTitle></CardHeader>
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
              <CardHeader><CardTitle className="text-sm">{t("carbon.emissionsByScope")}</CardTitle></CardHeader>
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
            <CardTitle className="text-base">{t("carbon.carbonDataEntries", { count: entries.length })}</CardTitle>
            {isOwner && (
              <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4 mr-1" />{showForm ? t("carbon.cancel") : t("carbon.addEntry")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant={calcMethod === "activity_based" ? "default" : "outline"} onClick={() => setCalcMethod("activity_based")}>
                  <Calculator className="h-3.5 w-3.5 mr-1" />{t("carbon.calculateFromActivityData")}
                </Button>
                <Button type="button" size="sm" variant={calcMethod === "manual_entry" ? "default" : "outline"} onClick={() => setCalcMethod("manual_entry")}>
                  {t("carbon.enterTotalDirectly")}
                </Button>
              </div>

              {calcMethod === "activity_based" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="bill-upload"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleBillUpload(e.target.files[0])}
                    />
                    <Button type="button" size="sm" variant="outline" disabled={extracting} asChild>
                      <label htmlFor="bill-upload" className="cursor-pointer">
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {extracting ? t("carbon.readingBill") : t("carbon.uploadBillPhoto")}
                      </label>
                    </Button>
                  </div>
                  {billResult && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t("carbon.aiRead", { quantity: billResult.quantity ?? "?", unit: billResult.unit ?? "", activityType: billResult.activity_type })}
                        <Badge variant="outline" className="text-xs">{t("carbon.confidenceLevel", { confidence: billResult.confidence })}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[billResult.vendor, billResult.billing_period].filter(Boolean).join(" · ") || t("carbon.noVendorPeriodDetected")}
                        {t("carbon.extractedByNdovuAkili")}
                      </p>
                      <Button type="button" size="sm" variant="secondary" onClick={applyBillResult}>{t("carbon.useThisQuantity")}</Button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>{t("carbon.category")}</Label>
                      <Select value={category} onValueChange={(v) => { setCategory(v); setFactorId(""); }}>
                        <SelectTrigger><SelectValue placeholder={t("carbon.selectCategory")} /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(CATEGORY_LABEL_KEYS).filter(c => factors.some(f => f.category === c)).map(c => (
                            <SelectItem key={c} value={c}>{t(CATEGORY_LABEL_KEYS[c])}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("carbon.activity")}</Label>
                      <Select value={factorId} onValueChange={setFactorId} disabled={!category}>
                        <SelectTrigger><SelectValue placeholder={t("carbon.selectActivity")} /></SelectTrigger>
                        <SelectContent>
                          {factors.filter(f => f.category === category).map(f => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.activity.replace(/_/g, " ")} — {f.region} ({f.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedFactor && (
                    <div>
                      <Label>{t("carbon.activityQuantity", { unit: selectedFactor.unit })}</Label>
                      <Input type="number" value={activityQuantity} onChange={e => setActivityQuantity(e.target.value)} placeholder="0.00" />
                    </div>
                  )}
                  {selectedFactor && (
                    <div className="rounded-md bg-background border p-3 text-sm space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <BookText className="h-3.5 w-3.5" />
                        {computedEmissions != null ? `${computedEmissions.toFixed(4)} tCO₂e` : t("carbon.enterQuantityToCalculate")}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedFactor.factor_kgco2e} kg CO₂e/{selectedFactor.unit} · {t("carbon.source")}: {selectedFactor.source} ({selectedFactor.source_year}) · {SCOPE_LABELS[selectedFactor.scope]}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t("carbon.emissionSource")}</Label>
                    <Select value={emissionSource} onValueChange={setEmissionSource}>
                      <SelectTrigger><SelectValue placeholder={t("carbon.selectSource")} /></SelectTrigger>
                      <SelectContent>
                        {EMISSION_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("carbon.estimatedEmissions")}</Label>
                    <Input type="number" value={emissions} onChange={e => setEmissions(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
              )}

              {calcMethod === "manual_entry" && (
                <div>
                  <Label>{t("carbon.scopeTypes")}</Label>
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
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>{t("carbon.reportingPeriodStart")}</Label>
                  <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <Label>{t("carbon.reportingPeriodEnd")}</Label>
                  <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>{t("carbon.fundingSource")}</Label>
                  <Select value={fundingSource} onValueChange={setFundingSource}>
                    <SelectTrigger><SelectValue placeholder={t("carbon.selectSource")} /></SelectTrigger>
                    <SelectContent>
                      {FUNDING_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("carbon.estimatedCostSavings")}</Label>
                  <Input type="number" value={savings} onChange={e => setSavings(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>{t("carbon.evidenceUrl")}</Label>
                <Input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={handleSubmit} disabled={calcMethod === "activity_based" ? !computedEmissions : !emissions}>{t("carbon.saveCarbonData")}</Button>
            </div>
          )}

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("carbon.noCarbonDataYet")}</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.emission_source && <Badge variant="secondary">{entry.emission_source}</Badge>}
                    {entry.scope_types?.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    {entry.carbon_verified ? (
                      <Badge className="bg-green-600 text-white text-xs">{t("carbon.verifiedBadge")}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-xs">{t("carbon.unverifiedBadge")}</Badge>
                    )}
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-muted-foreground">{t("carbon.emissionsLabel")}</span> {entry.estimated_emissions_tco2e?.toFixed(entry.calculation_method === "activity_based" ? 4 : 1) || "—"} tCO₂e</div>
                  {entry.funding_source && <div><span className="text-muted-foreground">{t("carbon.fundingLabel")}</span> {entry.funding_source}</div>}
                  {entry.estimated_savings && <div><span className="text-muted-foreground">{t("carbon.savingsLabel")}</span> ${entry.estimated_savings.toLocaleString()}</div>}
                  {entry.reporting_period_start && <div><span className="text-muted-foreground">{t("carbon.periodLabel")}</span> {entry.reporting_period_start} → {entry.reporting_period_end}</div>}
                </div>
                {entry.calculation_method === "activity_based" && entry.emission_factors ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookText className="h-3 w-3" />
                    {entry.activity_quantity} {entry.activity_unit} {t("carbon.of")} {entry.emission_factors.activity.replace(/_/g, " ")} ({entry.emission_factors.region}) · {t("carbon.source")}: {entry.emission_factors.source} ({entry.emission_factors.source_year})
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("carbon.selfReportedFigure")}</p>
                )}
                {entry.evidence_url && (
                  <a href={entry.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">{t("carbon.viewEvidence")}</a>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
