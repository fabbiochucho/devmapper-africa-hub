import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Coins, Plus, TrendingUp, ShieldCheck, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CarbonAssetsTabProps {
  reportId: string;
  isOwner: boolean;
}

interface CarbonAsset {
  id: string;
  credits_generated: number | null;
  credits_owned: number | null;
  credits_retired: number | null;
  methodology: string | null;
  verification_status: string;
  reference_price_usd: number | null;
  estimated_value_usd: number | null;
  issuance_date: string | null;
}

const METHODOLOGIES = ["CDM", "VCS", "Gold Standard", "ACR", "CAR", "Other"];

export default function CarbonAssetsTab({ reportId, isOwner }: CarbonAssetsTabProps) {
  const { user } = useAuth();
  const [asset, setAsset] = useState<CarbonAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [generated, setGenerated] = useState("");
  const [owned, setOwned] = useState("");
  const [retired, setRetired] = useState("");
  const [methodology, setMethodology] = useState("");
  const [verStatus, setVerStatus] = useState("unverified");
  const [refPrice, setRefPrice] = useState("");
  const [issuanceDate, setIssuanceDate] = useState("");

  useEffect(() => { fetchData(); }, [reportId]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("carbon_assets")
      .select("*")
      .eq("report_id", reportId)
      .maybeSingle();
    if (data) {
      setAsset(data as any);
      setGenerated(data.credits_generated?.toString() || "");
      setOwned(data.credits_owned?.toString() || "");
      setRetired(data.credits_retired?.toString() || "");
      setMethodology(data.methodology || "");
      setVerStatus(data.verification_status || "unverified");
      setRefPrice(data.reference_price_usd?.toString() || "");
      setIssuanceDate(data.issuance_date || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const gen = parseFloat(generated) || 0;
    const price = parseFloat(refPrice) || 0;
    const payload = {
      report_id: reportId,
      credits_generated: gen || null,
      credits_owned: parseFloat(owned) || null,
      credits_retired: parseFloat(retired) || null,
      methodology: methodology || null,
      verification_status: verStatus,
      reference_price_usd: price || null,
      estimated_value_usd: gen * price || null,
      issuance_date: issuanceDate || null,
    };

    let error;
    if (asset) {
      ({ error } = await supabase.from("carbon_assets").update(payload as any).eq("id", asset.id));
    } else {
      ({ error } = await supabase.from("carbon_assets").insert(payload as any));
    }
    if (error) { toast.error("Failed to save carbon assets"); return; }
    toast.success("Carbon assets saved");
    setEditing(false);
    fetchData();
  };

  const chartData = asset ? [
    { name: "Generated", value: asset.credits_generated || 0 },
    { name: "Owned", value: asset.credits_owned || 0 },
    { name: "Retired", value: asset.credits_retired || 0 },
  ] : [];

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Coins className="h-4 w-4" /> Generated</div>
            <p className="text-2xl font-bold">{asset?.credits_generated?.toFixed(0) || "—"} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Coins className="h-4 w-4" /> Owned</div>
            <p className="text-2xl font-bold">{asset?.credits_owned?.toFixed(0) || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Portfolio Value</div>
            <p className="text-2xl font-bold">${asset?.estimated_value_usd?.toLocaleString() || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ShieldCheck className="h-4 w-4" /> Status</div>
            <Badge variant={asset?.verification_status === "verified" ? "default" : "outline"}>
              {asset?.verification_status || "N/A"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {chartData.some(d => d.value > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Credit Portfolio</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Carbon Credits</CardTitle>
            {isOwner && !editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{asset ? "Edit" : "Add Credits"}</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><Label>Credits Generated (tCO₂e)</Label><Input type="number" value={generated} onChange={e => setGenerated(e.target.value)} /></div>
                <div><Label>Credits Owned</Label><Input type="number" value={owned} onChange={e => setOwned(e.target.value)} /></div>
                <div><Label>Credits Retired</Label><Input type="number" value={retired} onChange={e => setRetired(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Methodology</Label>
                  <Select value={methodology} onValueChange={setMethodology}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{METHODOLOGIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Verification Status</Label>
                  <Select value={verStatus} onValueChange={setVerStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Reference Price (USD/tCO₂e)</Label><Input type="number" value={refPrice} onChange={e => setRefPrice(e.target.value)} /></div>
              </div>
              <div><Label>Issuance Date</Label><Input type="date" value={issuanceDate} onChange={e => setIssuanceDate(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : asset ? (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {asset.methodology && <div><span className="font-medium">Methodology:</span> <Badge variant="outline">{asset.methodology}</Badge></div>}
                {asset.issuance_date && <div><span className="font-medium">Issued:</span> {asset.issuance_date}</div>}
                {asset.reference_price_usd && <div><span className="font-medium">Ref Price:</span> ${asset.reference_price_usd}/tCO₂e</div>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No carbon credit data recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
