import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Building2, DollarSign, Calendar, FileText } from "lucide-react";

interface ProcurementTrackerProps {
  reportId: string;
  isOwner: boolean;
}

interface ProcurementItem {
  id: string;
  contractor_name: string;
  contract_type: string;
  contract_value: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  procurement_method: string;
  scope: string | null;
  evidence_url: string | null;
  created_at: string;
}

const CONTRACT_TYPES = [
  { value: "goods", label: "Goods/Equipment" },
  { value: "works", label: "Construction/Works" },
  { value: "services", label: "Technical Services" },
  { value: "consultancy", label: "Consultancy" },
];

const PROCUREMENT_METHODS = [
  { value: "open_tender", label: "Open Tender" },
  { value: "restricted", label: "Restricted Bidding" },
  { value: "direct", label: "Direct Procurement" },
  { value: "framework", label: "Framework Agreement" },
];

const CONTRACT_STATUSES = [
  { value: "tendering", label: "Tendering", color: "bg-orange-500/10 text-orange-600" },
  { value: "awarded", label: "Awarded", color: "bg-blue-500/10 text-blue-600" },
  { value: "active", label: "Active", color: "bg-green-500/10 text-green-600" },
  { value: "completed", label: "Completed", color: "bg-gray-500/10 text-gray-600" },
  { value: "terminated", label: "Terminated", color: "bg-red-500/10 text-red-600" },
];

export default function ProcurementTracker({ reportId, isOwner }: ProcurementTrackerProps) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ProcurementItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [contractorName, setContractorName] = useState("");
  const [contractType, setContractType] = useState("goods");
  const [contractValue, setContractValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("tendering");
  const [procurementMethod, setProcurementMethod] = useState("open_tender");
  const [scope, setScope] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  useEffect(() => { fetchContracts(); }, [reportId]);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_procurement")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setContracts(data);
    }
    setLoading(false);
  };

  const addContract = async () => {
    if (!contractorName.trim() || !contractValue || !user) return;
    
    const { error } = await supabase.from("project_procurement").insert({
      report_id: reportId,
      contractor_name: contractorName.trim(),
      contract_type: contractType,
      contract_value: parseFloat(contractValue),
      currency,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
      procurement_method: procurementMethod,
      scope: scope.trim() || null,
      evidence_url: evidenceUrl.trim() || null,
      created_by: user.id,
    });

    if (error) {
      toast.error("Failed to add contract");
    } else {
      toast.success("Contract added successfully");
      setDialogOpen(false);
      resetForm();
      fetchContracts();
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: string) => {
    await supabase
      .from("project_procurement")
      .update({ status: newStatus })
      .eq("id", contractId);
    fetchContracts();
    toast.success("Status updated");
  };

  const resetForm = () => {
    setContractorName("");
    setContractType("goods");
    setContractValue("");
    setCurrency("USD");
    setStartDate("");
    setEndDate("");
    setStatus("tendering");
    setProcurementMethod("open_tender");
    setScope("");
    setEvidenceUrl("");
  };

  const totalValue = contracts.reduce((sum, c) => sum + c.contract_value, 0);
  const activeContracts = contracts.filter(c => c.status === "active").length;
  const completedContracts = contracts.filter(c => c.status === "completed").length;

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading contracts...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Procurement & Contracts ({contracts.length})
            </CardTitle>
            {isOwner && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Contract</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Add New Contract</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="space-y-2">
                      <Label>Contractor Name</Label>
                      <Input value={contractorName} onChange={e => setContractorName(e.target.value)} placeholder="Company/Individual name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contract Type</Label>
                      <Select value={contractType} onValueChange={setContractType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONTRACT_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Contract Value</Label>
                      <Input type="number" value={contractValue} onChange={e => setContractValue(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="KES">KES</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                          <SelectItem value="GHS">GHS</SelectItem>
                          <SelectItem value="ZAR">ZAR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CONTRACT_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Procurement Method</Label>
                      <Select value={procurementMethod} onValueChange={setProcurementMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROCUREMENT_METHODS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Scope of Work</Label>
                      <Textarea value={scope} onChange={e => setScope(e.target.value)} placeholder="Brief description of work/deliverables..." />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Evidence/Contract URL</Label>
                      <Input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={addContract} className="w-full" disabled={!contractorName.trim() || !contractValue}>
                        Add Contract
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Contract Value</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activeContracts}</div>
              <p className="text-xs text-muted-foreground">Active Contracts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground/60">{completedContracts}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          {/* Contracts List */}
          {contracts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No contracts tracked yet.</p>
              <p className="text-sm">Add contracts to monitor procurement activities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map(contract => {
                const statusConfig = CONTRACT_STATUSES.find(s => s.value === contract.status);
                const typeConfig = CONTRACT_TYPES.find(t => t.value === contract.contract_type);
                return (
                  <div key={contract.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{contract.contractor_name}</h4>
                        <p className="text-sm text-muted-foreground">{typeConfig?.label}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">
                          {contract.currency} {contract.contract_value.toLocaleString()}
                        </div>
                        <Badge className={statusConfig?.color} variant="secondary">
                          {statusConfig?.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {contract.scope && (
                      <p className="text-sm border-l-2 pl-2">{contract.scope}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {contract.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {contract.start_date} → {contract.end_date || "TBD"}
                        </span>
                      )}
                      {contract.evidence_url && (
                        <a href={contract.evidence_url} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-3 w-3" />
                          Evidence
                        </a>
                      )}
                    </div>

                    {isOwner && (
                      <div className="pt-2">
                        <Select value={contract.status} onValueChange={v => updateContractStatus(contract.id, v)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}