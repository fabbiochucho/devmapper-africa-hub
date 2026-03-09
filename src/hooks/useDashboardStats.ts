import { supabase } from '@/integrations/supabase/client';
import { useOptimizedQuery, STALE_TIMES } from './useOptimizedQuery';
import { CacheKeys } from '@/lib/query-utils';

export interface DashboardStats {
  total_reports: number;
  total_change_makers: number;
  total_campaigns: number;
  total_funds_raised: number;
  countries_count: number;
  last_updated: string;
}

const defaultStats: DashboardStats = {
  total_reports: 0,
  total_change_makers: 0,
  total_campaigns: 0,
  total_funds_raised: 0,
  countries_count: 0,
  last_updated: new Date().toISOString(),
};

export function useDashboardStats() {
  return useOptimizedQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    deduplicationKey: CacheKeys.dashboardStats(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      return data?.[0] ?? defaultStats;
    },
    // Dashboard stats update infrequently, cache for 10 minutes
    staleTime: STALE_TIMES.SEMI_STATIC,
    refetchOnWindowFocus: false,
  });
}
