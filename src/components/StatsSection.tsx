import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  totalProjects: number;
  countriesCount: number;
  totalInvestment: number;
  verificationRate: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatsData>({
    totalProjects: 0,
    countriesCount: 0,
    totalInvestment: 0,
    verificationRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total projects
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('id, country_code, cost, is_verified');

        if (reportsError) throw reportsError;

        // Get change makers count
        const { data: changeMakers, error: changeMakersError } = await supabase
          .from('change_makers')
          .select('id');

        if (changeMakersError) throw changeMakersError;

        // Calculate stats
        const totalProjects = reports?.length || 0;
        const countriesCount = new Set(reports?.map(r => r.country_code).filter(Boolean)).size;
        const totalInvestment = reports?.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) || 0;
        const verifiedProjects = reports?.filter(r => r.is_verified).length || 0;
        const verificationRate = totalProjects > 0 ? Math.round((verifiedProjects / totalProjects) * 100) : 0;

        setStats({
          totalProjects,
          countriesCount,
          totalInvestment,
          verificationRate,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
              {stats.totalProjects.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Projects Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.countriesCount}
            </div>
            <div className="text-muted-foreground">African Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ${(stats.totalInvestment / 1000000).toFixed(1)}M
            </div>
            <div className="text-muted-foreground">Total Investment</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats.verificationRate}%
            </div>
            <div className="text-muted-foreground">Verification Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}