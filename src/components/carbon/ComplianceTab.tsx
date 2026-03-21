import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Scale, Globe, FileCheck, AlertTriangle, ShieldCheck } from "lucide-react";

interface ComplianceTabProps {
  reportId: string;
  isOwner: boolean;
}

interface ComplianceEntry {
  id: string;
  country_of_origin: string | null;
  jurisdiction: string | null;
  compliance_type: string;
  itmo_eligible: boolean;
  article6_status: string | null;
  er_credits_issued: number | null;
}

export default function ComplianceTab({ reportId, isOwner }: ComplianceTabProps) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<ComplianceEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [country, setCountry] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [compType, setCompType] = useState("voluntary");
  const [itmo, setItmo] = useState(false);
  const [a6Status, setA6Status] = useState("");
  const [erCredits, setErCredits] = useState("");

  // Fetch carbon data for offset gap calculation
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => { fetchData(); }, [reportId]);

  const fetchData = async () => {
    const [compResult, carbonResult, assetResult] = await Promise.all([
      supabase.from("carbon_compliance").select("*").eq("report_id", reportId).maybeSingle(),
      supabase.from("project_carbon_data").select("estimated_emissions_tco2e").eq("report_id", reportId),
      supabase.from("carbon_assets").select("credits_owned").eq("report_id", reportId).maybeSingle(),
    ]);

    if (compResult.data) {
      const d = compResult.data as any;
      setEntry(d);
      setCountry(d.country_of_origin || "");
      setJurisdiction(d.jurisdiction || "");
      setCompType(d.compliance_type || "voluntary");
      setItmo(d.itmo_eligible || false);
      setA6Status(d.article6_status || "");
      setErCredits(d.er_credits_issued?.toString() || "");
    }
    setTotalEmissions(carbonResult.data?.reduce((s: number, e: any) => s + (e.estimated_emissions_tco2e || 0), 0) || 0);
    setTotalCredits(assetResult.data?.credits_owned || 0);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const payload = {
      report_id: reportId,
      country_of_origin: country || null,
      jurisdiction: jurisdiction || null,
      compliance_type: compType,
      itmo_eligible: itmo,
      article6_status: a6Status || null,
      er_credits_issued: erCredits ? parseFloat(erCredits) : null,
    };

    let error;
    if (entry) {
      ({ error } = await supabase.from("carbon_compliance").update(payload as any).eq("id", entry.id));
    } else {
      ({ error } = await supabase.from("carbon_compliance").insert(payload as any));
    }
    if (error) { toast.error("Failed to save compliance data"); return; }
    toast.success("Compliance data saved");
    setEditing(false);
    fetchData();
  };

  const offsetGap = totalEmissions - totalCredits;
  const carbonLiability = offsetGap > 0 ? offsetGap * 25 : 0; // $25/tCO₂e estimate

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Compliance Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Scale className="h-4 w-4" /> Offset Gap</div>
            <p className="text-2xl font-bold">{offsetGap.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
            {offsetGap > 0 && <Badge variant="outline" className="text-yellow-600 border-yellow-400 mt-1">⚠ Shortfall</Badge>}
            {offsetGap <= 0 && totalEmissions > 0 && <Badge className="bg-green-600 text-white mt-1">✔ Covered</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" /> Carbon Liability</div>
            <p className="text-2xl font-bold">${carbonLiability.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">@ $25/tCO₂e estimate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Globe className="h-4 w-4" /> Article 6</div>
            <Badge variant={entry?.itmo_eligible ? "default" : "outline"}>
              {entry?.itmo_eligible ? "ITMO Eligible" : "Not Eligible"}
            </Badge>
            {entry?.article6_status && <p className="text-xs text-muted-foreground mt-1">Status: {entry.article6_status}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Carbon Compliance</CardTitle>
            {isOwner && !editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{entry ? "Edit" : "Configure"}</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Country of Origin</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., Nigeria" /></div>
                <div><Label>Jurisdiction</Label><Input value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="e.g., Federal" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Compliance Type</Label>
                  <Select value={compType} onValueChange={setCompType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voluntary">Voluntary</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Article 6.4 Status</Label>
                  <Select value={a6Status} onValueChange={setA6Status}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="issued">Issued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Label>ITMO Eligible (Article 6.2)</Label>
                  <Switch checked={itmo} onCheckedChange={setItmo} />
                </div>
                <div><Label>ER Credits Issued</Label><Input type="number" value={erCredits} onChange={e => setErCredits(e.target.value)} /></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : entry ? (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {entry.country_of_origin && <div><span className="font-medium">Country:</span> {entry.country_of_origin}</div>}
                {entry.jurisdiction && <div><span className="font-medium">Jurisdiction:</span> {entry.jurisdiction}</div>}
                <div><span className="font-medium">Type:</span> <Badge variant="outline">{entry.compliance_type}</Badge></div>
                {entry.er_credits_issued && <div><span className="font-medium">ER Credits:</span> {entry.er_credits_issued} tCO₂e</div>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No compliance data configured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
