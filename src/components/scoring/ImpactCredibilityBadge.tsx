import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { getCredibilityBgColor, getCredibilityLabel } from "@/lib/impact-credibility";

interface ImpactCredibilityBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function ImpactCredibilityBadge({ score, showLabel = true, size = "sm" }: ImpactCredibilityBadgeProps) {
  const colorClass = getCredibilityBgColor(score);
  const label = getCredibilityLabel(score);

  return (
    <Badge variant="outline" className={`${colorClass} gap-1 ${size === "sm" ? "text-xs" : "text-sm"}`}>
      <Shield className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {score}/100
      {showLabel && <span className="ml-1">{label}</span>}
    </Badge>
  );
}
