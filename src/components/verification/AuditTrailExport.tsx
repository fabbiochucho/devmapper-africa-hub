import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, FileJson, FileText, Search, Shield, Link2 } from "lucide-react";

const AuditTrailExport = ({ reportId }: { reportId?: string }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-trail-export", reportId],
    queryFn: async () => {
      let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      if (reportId) query = query.eq("target_id", reportId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: evidenceItems } = useQuery({
    queryKey: ["evidence-items-export", reportId],
    queryFn: async () => {
      if (!reportId) return [];
      const { data } = await supabase.from("evidence_items").select("*").eq("report_id", reportId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!reportId,
  });

  const filteredLogs = auditLogs?.filter(l =>
    !searchTerm || l.action?.toLowerCase().includes(searchTerm.toLowerCase()) || l.target_table?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportJSON = () => {
    const exportData = {
      export_date: new Date().toISOString(),
      report_id: reportId || "all",
      audit_entries: filteredLogs?.map(l => ({
        timestamp: l.created_at,
        actor_type: l.actor_type,
        action: l.action,
        target_table: l.target_table,
        target_id: l.target_id,
        payload: l.payload,
      })),
      evidence: evidenceItems?.map(e => ({
        title: e.title,
        type: e.evidence_type,
        verification_status: e.verification_status,
        verification_stage: e.verification_stage,
        file_url: e.file_url,
        uploaded_at: e.created_at,
      })),
      total_entries: filteredLogs?.length || 0,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devmapper-audit-trail-${reportId ? reportId.slice(0, 8) : "all"}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit trail exported as JSON");
  };

  const exportPDF = () => {
    // Generate a printable HTML that can be saved as PDF
    const htmlContent = `
<!DOCTYPE html>
<html><head><title>DevMapper Audit Trail</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 8px; }
  h2 { color: #065f46; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  th { background: #f0fdf4; padding: 8px; text-align: left; border: 1px solid #d1d5db; }
  td { padding: 6px 8px; border: 1px solid #d1d5db; }
  .meta { color: #6b7280; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
  .verified { background: #dcfce7; color: #166534; }
  .pending { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #d1d5db; font-size: 11px; color: #9ca3af; }
</style></head>
<body>
  <h1>DevMapper - Audit Trail Report</h1>
  <p class="meta">Generated: ${new Date().toLocaleString()}</p>
  <p class="meta">Report ID: ${reportId || "All Records"}</p>
  <p class="meta">Total Entries: ${filteredLogs?.length || 0}</p>
  
  <h2>Audit Log Entries</h2>
  <table>
    <tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th></tr>
    ${filteredLogs?.map(l => `<tr><td>${new Date(l.created_at!).toLocaleString()}</td><td>${l.actor_type}</td><td>${l.action}</td><td>${l.target_table || ""}</td></tr>`).join("") || ""}
  </table>
  
  ${evidenceItems?.length ? `
  <h2>Evidence Items</h2>
  <table>
    <tr><th>Title</th><th>Type</th><th>Status</th><th>Stage</th><th>Uploaded</th></tr>
    ${evidenceItems.map(e => `<tr><td>${e.title}</td><td>${e.evidence_type}</td><td><span class="badge ${e.verification_status === "verified" ? "verified" : "pending"}">${e.verification_status}</span></td><td>${e.verification_stage || "-"}</td><td>${new Date(e.created_at).toLocaleDateString()}</td></tr>`).join("")}
  </table>` : ""}
  
  <div class="footer">
    <p>This report was generated by DevMapper - Africa's Carbon Economy Operating System</p>
    <p>Verification integrity ensured via cryptographic hash-chain audit trail</p>
  </div>
</body></html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      setTimeout(() => { w.print(); }, 500);
    }
    toast.success("Audit trail opened for PDF export (use Print > Save as PDF)");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Audit Trail</CardTitle>
            <CardDescription>Immutable verification log with cryptographic hash-chain integrity</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportJSON}><FileJson className="h-4 w-4 mr-1" />Export JSON</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="h-4 w-4 mr-1" />Export PDF</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search actions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        {evidenceItems && evidenceItems.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><Link2 className="h-4 w-4" />Proof of Impact Evidence</h3>
            <div className="flex flex-wrap gap-2">
              {evidenceItems.map(e => (
                <Badge key={e.id} variant={e.verification_status === "verified" ? "default" : "outline"} className="text-xs">
                  {e.evidence_type}: {e.title} ({e.verification_status})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading audit trail...</div>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at!).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{l.actor_type}</Badge></TableCell>
                    <TableCell className="font-medium text-sm">{l.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.target_table}</TableCell>
                  </TableRow>
                ))}
                {filteredLogs?.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No audit entries found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditTrailExport;
