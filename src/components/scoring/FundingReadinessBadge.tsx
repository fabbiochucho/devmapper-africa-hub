import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
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
    <Badge variant="outline" className={`${colorClass} gap-1 ${size === "sm" ? "text-xs" : "text-sm"}`}>
      <TrendingUp className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {score}/100
      {showLabel && <span className="ml-1">{label}</span>}
    </Badge>
  );
}
