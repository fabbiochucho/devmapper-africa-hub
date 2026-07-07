import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { RiskFlag } from "@/lib/risk-flags";

const SEVERITY_ICON: Record<RiskFlag["severity"], typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const SEVERITY_CLASS: Record<RiskFlag["severity"], string> = {
  high: "text-destructive",
  medium: "text-yellow-600",
  low: "text-muted-foreground",
};

export default function RiskFlagsList({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) {
    return <p className="text-sm text-muted-foreground">No risk flags detected.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {flags.map((flag, i) => {
        const Icon = SEVERITY_ICON[flag.severity];
        return (
          <li key={i} className={`flex items-start gap-2 text-sm ${SEVERITY_CLASS[flag.severity]}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{flag.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
