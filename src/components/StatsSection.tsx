import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function StatsSection() {
  // Projects/countries/investment come from the same materialized-view-backed
  // hook every other stats display on the site uses (mv_dashboard_stats via
  // get_dashboard_stats()) - this file previously re-derived them itself by
  // pulling every row of the reports table client-side, which is both slower
  // and a second, divergent source of truth for the same numbers.
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Verification rate isn't in mv_dashboard_stats, so it needs its own
  // query - but as two lean COUNT-only requests (head: true fetches no row
  // data), not a full-table select of every report's columns.
  const [verificationRate, setVerificationRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchVerificationRate = async () => {
      const [{ count: total }, { count: verified }] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      ]);
      setVerificationRate(total ? Math.round(((verified ?? 0) / total) * 100) : 0);
    };

    fetchVerificationRate().catch((error) => console.error('Error fetching verification rate:', error));
  }, []);

  const loading = statsLoading || verificationRate === null;

  if (loading) {
    return (
      <section className="py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-muted-foreground mb-2 animate-pulse">---</div>
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {(stats?.total_reports ?? 0).toLocaleString()}
            </div>
            <div className="text-muted-foreground">Projects Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats?.countries_count ?? 0}
            </div>
            <div className="text-muted-foreground">African Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ${((stats?.total_funds_raised ?? 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-muted-foreground">Total Investment</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {verificationRate ?? 0}%
            </div>
            <div className="text-muted-foreground">Verification Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}