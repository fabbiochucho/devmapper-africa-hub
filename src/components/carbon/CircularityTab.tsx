import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Recycle, Trash2, Plus, Leaf } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CircularityTabProps {
  reportId: string;
  isOwner: boolean;
}

interface CircularityEntry {
  id: string;
  material_input_type: string | null;
  material_input_quantity: number | null;
  waste_generated_tonnes: number | null;
  waste_recycled_tonnes: number | null;
  reuse_percentage: number | null;
  circularity_score: number | null;
}

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function CircularityTab({ reportId, isOwner }: CircularityTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<CircularityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [materialType, setMaterialType] = useState("");
  const [materialQty, setMaterialQty] = useState("");
  const [wasteGen, setWasteGen] = useState("");
  const [wasteRec, setWasteRec] = useState("");
  const [reusePct, setReusePct] = useState("");

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("project_circularity")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }, [reportId]);

  useEffect(() => { fetchData(); }, [fetchData, reportId]);

  const calcCircularityScore = (wasteG: number, wasteR: number, reuse: number): number => {
    const diversionFactor = wasteG > 0 ? (wasteR / wasteG) * 0.5 : 0;
    const reuseFactor = (reuse / 100) * 0.3;
    // No real per-entry efficiency signal is collected yet, so this
    // contributes a flat 20/100 baseline to every score rather than
    // measuring anything - disclosed in the UI (see the caption under
    // "Circularity Score" below) rather than left unstated.
    const efficiencyFactor = 0.2;
    return Math.min(Math.round((diversionFactor + reuseFactor + efficiencyFactor) * 100), 100);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const wg = parseFloat(wasteGen) || 0;
    const wr = parseFloat(wasteRec) || 0;
    const rp = parseFloat(reusePct) || 0;
    const score = calcCircularityScore(wg, wr, rp);

    const { error } = await supabase.from("project_circularity").insert({
      report_id: reportId,
      material_input_type: materialType || null,
      material_input_quantity: materialQty ? parseFloat(materialQty) : null,
      waste_generated_tonnes: wg || null,
      waste_recycled_tonnes: wr || null,
      reuse_percentage: rp || null,
      circularity_score: score,
    });
    if (error) { toast.error(t("carbon.circularity.saveFailed")); return; }
    toast.success(t("carbon.circularity.saved"));
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("project_circularity").delete().eq("id", id);
    toast.success(t("carbon.circularity.entryDeleted"));
    fetchData();
  };

  const resetForm = () => {
    setShowForm(false);
    setMaterialType(""); setMaterialQty(""); setWasteGen(""); setWasteRec(""); setReusePct("");
  };

  const totalWaste = entries.reduce((s, e) => s + (e.waste_generated_tonnes || 0), 0);
  const totalRecycled = entries.reduce((s, e) => s + (e.waste_recycled_tonnes || 0), 0);
  const diversionRate = totalWaste > 0 ? Math.round((totalRecycled / totalWaste) * 100) : 0;
  const avgScore = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + (e.circularity_score || 0), 0) / entries.length) : 0;

  const pieData = totalWaste > 0 ? [
    { name: t("carbon.circularity.recycled"), value: totalRecycled },
    { name: t("carbon.circularity.reused"), value: totalWaste * (entries.reduce((s, e) => s + (e.reuse_percentage || 0), 0) / Math.max(entries.length, 1) / 100) },
    { name: t("carbon.circularity.waste"), value: Math.max(0, totalWaste - totalRecycled) },
  ].filter(d => d.value > 0) : [];

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Recycle className="h-4 w-4" /> {t("carbon.circularity.wasteDiversion")}</div>
            <p className="text-2xl font-bold">{diversionRate}%</p>
            <Progress value={diversionRate} className="h-2 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Leaf className="h-4 w-4" /> {t("carbon.circularity.circularityScore")}</div>
            <p className="text-2xl font-bold">{avgScore}/100</p>
            <Badge variant={avgScore >= 70 ? "default" : avgScore >= 40 ? "secondary" : "outline"} className="mt-1">
              {avgScore >= 70 ? t("carbon.circularity.high") : avgScore >= 40 ? t("carbon.circularity.medium") : t("carbon.circularity.low")}
            </Badge>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("carbon.circularity.scoreCaption")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Recycle className="h-4 w-4" /> {t("carbon.circularity.recyclingRate")}</div>
            <p className="text-2xl font-bold">{totalRecycled.toFixed(1)}/{totalWaste.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{t("carbon.circularity.tonnes")}</span></p>
          </CardContent>
        </Card>
      </div>

      {pieData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("carbon.circularity.materialFlowDistribution")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("carbon.circularity.entriesTitle", { count: entries.length })}</CardTitle>
            {isOwner && <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" />{showForm ? t("carbon.circularity.cancel") : t("carbon.circularity.addEntry")}</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>{t("carbon.circularity.materialInputType")}</Label><Input value={materialType} onChange={e => setMaterialType(e.target.value)} placeholder={t("carbon.circularity.materialInputTypePlaceholder")} /></div>
                <div><Label>{t("carbon.circularity.materialQuantity")}</Label><Input type="number" value={materialQty} onChange={e => setMaterialQty(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label>{t("carbon.circularity.wasteGenerated")}</Label><Input type="number" value={wasteGen} onChange={e => setWasteGen(e.target.value)} /></div>
                <div><Label>{t("carbon.circularity.wasteRecycled")}</Label><Input type="number" value={wasteRec} onChange={e => setWasteRec(e.target.value)} /></div>
                <div><Label>{t("carbon.circularity.reusePercentage")}</Label><Input type="number" value={reusePct} onChange={e => setReusePct(e.target.value)} min="0" max="100" /></div>
              </div>
              <Button onClick={handleSubmit}>{t("carbon.circularity.saveEntry")}</Button>
            </div>
          )}
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("carbon.circularity.noDataYet")}</p>
          ) : entries.map(entry => (
            <div key={entry.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {entry.material_input_type && <Badge variant="secondary">{entry.material_input_type}</Badge>}
                  <Badge variant="outline">{t("carbon.circularity.entryScore", { score: entry.circularity_score })}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-muted-foreground">
                  {entry.material_input_quantity && <span>{t("carbon.circularity.entryInput", { value: entry.material_input_quantity })}</span>}
                  {entry.waste_generated_tonnes && <span>{t("carbon.circularity.entryWaste", { value: entry.waste_generated_tonnes })}</span>}
                  {entry.waste_recycled_tonnes && <span>{t("carbon.circularity.entryRecycled", { value: entry.waste_recycled_tonnes })}</span>}
                  {entry.reuse_percentage && <span>{t("carbon.circularity.entryReuse", { value: entry.reuse_percentage })}</span>}
                </div>
              </div>
              {isOwner && <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}><Trash2 className="h-3 w-3" /></Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
