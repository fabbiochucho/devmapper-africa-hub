import { Badge } from "@/components/ui/badge";
import { TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFundingReadinessBgColor, getFundingReadinessLabel } from "@/lib/funding-readiness";

interface FundingReadinessBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function FundingReadinessBadge({ score, showLabel = true, size = "sm" }: FundingReadinessBadgeProps) {
  const colorClass = getFundingReadinessBgColor(score);
  const label = getFundingReadinessLabel(score);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${colorClass} gap-1 cursor-help ${size === "sm" ? "text-xs" : "text-sm"}`}>
            <TrendingUp className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            {score}/100
            {showLabel && <span className="ml-1">{label}</span>}
            <Info className={size === "sm" ? "h-3 w-3 opacity-60" : "h-3.5 w-3.5 opacity-60"} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">Project funding readiness (indicative)</p>
          <ul className="mt-1 list-disc pl-4 text-xs">
            <li>Return on investment: up to 30</li>
            <li>Financials entered: 25</li>
            <li>Fundraising raised vs target: up to 20</li>
            <li>Revenue, savings or carbon-credit income: up to 15</li>
            <li>Timeline on track: 10</li>
          </ul>
          <p className="mt-1 text-xs">Measures the project, not the organisation's capacity to manage funds.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
