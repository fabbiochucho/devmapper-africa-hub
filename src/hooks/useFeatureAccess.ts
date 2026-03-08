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

  useEffect(() => {
    fetchFeatureAccess();
  }, []);

  const fetchFeatureAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        await loadFeaturesForPlan('free');
        return;
      }

      // Get user's organization, plan, and scholarship override
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(plan_type, scholarship_override, project_quota_remaining, project_cap)')
        .eq('user_id', user.id)
        .single();

      const org = membership?.organizations as any;
      // Effective plan considers scholarship override
      const effectivePlan = org?.scholarship_override || org?.plan_type || 'free';
      setUserPlan(effectivePlan as PlanType);
      setQuotaRemaining(org?.project_quota_remaining ?? null);
      setProjectCap(org?.project_cap ?? null);
      
      await loadFeaturesForPlan(effectivePlan as PlanType);
    } catch (error) {
      console.error('Error fetching feature access:', error);
      await loadFeaturesForPlan('free');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturesForPlan = async (plan: PlanType) => {
    // Load from both feature_flags (existing) and plan_features (new) tables
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
    return features[feature] === true;
  }, [features]);

  const requiresUpgrade = useCallback((feature: string): boolean => {
    return !canAccess(feature);
  }, [canAccess]);

  const hasQuota = useCallback((): boolean => {
    if (quotaRemaining === null) return true; // No org = no enforcement
    return quotaRemaining > 0;
  }, [quotaRemaining]);

  return {
    canAccess,
    requiresUpgrade,
    hasQuota,
    features,
    loading,
    userPlan,
    quotaRemaining,
    projectCap,
    refresh: fetchFeatureAccess
  };
}
