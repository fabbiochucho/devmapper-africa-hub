import { Users, FileCheck, Globe2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

/**
 * Compact social-proof strip placed right below the hero - "join N
 * change-makers" framing rather than the fuller animated stat cards further
 * down the page (ImpactMetricsSection). Reads the same real mv_dashboard_stats
 * data via useDashboardStats(); renders nothing until real numbers arrive so
 * it never shows a fabricated placeholder count.
 */
export default function SocialProofBanner() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats || stats.total_change_makers <= 0) return null;

  return (
    <div className="border-y bg-muted/40 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary shrink-0" />
          Join <strong className="text-foreground tabular-nums">{stats.total_change_makers.toLocaleString()}</strong> change-makers tracking real impact
        </span>
        <span className="flex items-center gap-1.5">
          <FileCheck className="h-4 w-4 text-primary shrink-0" />
          <strong className="text-foreground tabular-nums">{stats.total_reports.toLocaleString()}</strong> projects reported
        </span>
        <span className="flex items-center gap-1.5">
          <Globe2 className="h-4 w-4 text-primary shrink-0" />
          Across <strong className="text-foreground tabular-nums">{stats.countries_count.toLocaleString()}</strong> African countries
        </span>
      </div>
    </div>
  );
}
