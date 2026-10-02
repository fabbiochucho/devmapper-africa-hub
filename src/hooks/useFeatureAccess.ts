import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlags {
  [feature: string]: boolean;
}

type PlanType = 'free' | 'lite' | 'individual' | 'pro' | 'advanced' | 'enterprise';

// Plans are cumulative: a plan includes every lower tier's features (matches plan_rank() in SQL).
const PLAN_ORDER: PlanType[] = ['free', 'lite', 'individual', 'pro', 'advanced', 'enterprise'];
const plansUpTo = (plan: PlanType) => PLAN_ORDER.slice(0, Math.max(PLAN_ORDER.indexOf(plan), 0) + 1);

export function useFeatureAccess() {
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [projectCap, setProjectCap] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFeatureAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserPlan('lite');
        await loadFeaturesForPlan('lite');
        return;
      }

      // Check if user is admin or platform_admin — admins get unlimited access
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('role', ['admin', 'platform_admin', 'country_admin']);

      if (adminRoles && adminRoles.length > 0) {
        setIsAdmin(true);
        setUserPlan('enterprise');
        setQuotaRemaining(null);
        setProjectCap(null);
        // Admins get all features enabled — set a wildcard flag
        setFeatures({ __admin_unrestricted__: true });
        return;
      }

      // Plan: the best of the organisation's plan, an individual plan, or an approved scholarship.
      const [{ data: planName }, { data: membership }] = await Promise.all([
        supabase.rpc('effective_plan'),
        supabase
          .from('organization_members')
          .select('organization_id, organizations(project_quota_remaining, project_cap)')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const org = membership?.organizations;
      const effectivePlan = (PLAN_ORDER.includes(planName as PlanType) ? planName : 'free') as PlanType;
      setUserPlan(effectivePlan as PlanType);
      setQuotaRemaining(org?.project_quota_remaining ?? null);
      setProjectCap(org?.project_cap ?? null);

      await loadFeaturesForPlan(effectivePlan as PlanType);
    } catch (error) {
      console.error('Error fetching feature access:', error);
      await loadFeaturesForPlan('lite');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatureAccess();
  }, [fetchFeatureAccess]);

  const loadFeaturesForPlan = async (plan: PlanType) => {
    const flagsResult = await supabase
      .from('feature_flags')
      .select('feature, enabled')
      .in('plan', plansUpTo(plan))
      .eq('enabled', true);

    const featureMap: FeatureFlags = {};

    flagsResult.data?.forEach(item => {
      featureMap[item.feature] = item.enabled;
    });

    setFeatures(featureMap);
  };

  const canAccess = useCallback((feature: string): boolean => {
    // Admins bypass all feature gates
    if (isAdmin || features['__admin_unrestricted__']) return true;
    return features[feature] === true;
  }, [features, isAdmin]);

  const requiresUpgrade = useCallback((feature: string): boolean => {
    return !canAccess(feature);
  }, [canAccess]);

  const hasQuota = useCallback((): boolean => {
    if (isAdmin) return true; // Admins have unlimited quota
    if (quotaRemaining === null) return true;
    return quotaRemaining > 0;
  }, [quotaRemaining, isAdmin]);

  return {
    canAccess,
    requiresUpgrade,
    hasQuota,
    features,
    loading,
    userPlan,
    quotaRemaining,
    projectCap,
    isAdmin,
    refresh: fetchFeatureAccess
  };
}
