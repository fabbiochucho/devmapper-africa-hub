import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useUserRole } from "@/contexts/UserRoleContext";

interface AuditEntry {
  agentName: string;
  confidenceScore: number;
  dataSources: string[];
  createdAt: string;
}

interface NdovuAuditTrailProps {
  sessionId: string;
  entries: AuditEntry[];
}

export default function NdovuAuditTrail({ sessionId, entries }: NdovuAuditTrailProps) {
  const [expanded, setExpanded] = useState(false);
  const { currentRole } = useUserRole();
  const isAdmin = currentRole === 'admin' || currentRole === 'platform_admin';

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify({ sessionId, entries }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ndovu-audit-${sessionId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-md mt-3">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-8 text-xs"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Audit Trail ({entries.length} agents)</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      {expanded && (
        <div className="p-3 space-y-2 text-xs border-t">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{entry.agentName}</Badge>
                <span>Confidence: {entry.confidenceScore}%</span>
              </div>
              {isAdmin && (
                <span className="text-muted-foreground">
                  Sources: {entry.dataSources?.join(', ') || 'N/A'}
                </span>
              )}
            </div>
          ))}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExportJson}>
            <Download className="h-3 w-3" /> Export JSON
          </Button>
        </div>
      )}
    </div>
  );
}
