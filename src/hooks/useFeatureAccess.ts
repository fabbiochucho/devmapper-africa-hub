import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlags {
  [feature: string]: boolean;
}

type PlanType = 'free' | 'lite' | 'pro' | 'advanced' | 'enterprise';

export function useFeatureAccess() {
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [projectCap, setProjectCap] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchFeatureAccess();
  }, []);

  const fetchFeatureAccess = async () => {
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

      // Get user's organization, plan, and scholarship override
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(plan_type, scholarship_override, project_quota_remaining, project_cap)')
        .eq('user_id', user.id)
        .single();

      const org = membership?.organizations as any;
      const effectivePlan = org?.scholarship_override || org?.plan_type || 'lite';
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
  };

  const loadFeaturesForPlan = async (plan: PlanType) => {
    const [flagsResult, planFeaturesResult] = await Promise.all([
      supabase
        .from('feature_flags')
        .select('feature, enabled')
        .eq('plan', plan as any)
        .eq('enabled', true),
      supabase
        .from('plan_features')
        .select('feature_key, enabled')
        .eq('plan', plan)
        .eq('enabled', true),
    ]);

    const featureMap: FeatureFlags = {};

    flagsResult.data?.forEach(item => {
      featureMap[item.feature] = item.enabled;
    });

    planFeaturesResult.data?.forEach(item => {
      featureMap[item.feature_key] = item.enabled;
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
