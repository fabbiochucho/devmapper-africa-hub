import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlags {
  [feature: string]: boolean;
}

export function useFeatureAccess() {
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'lite' | 'pro'>('free');

  useEffect(() => {
    fetchFeatureAccess();
  }, []);

  const fetchFeatureAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in - use free tier features
        await loadFeaturesForPlan('free');
        return;
      }

      // Get user's organization and plan
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(plan_type)')
        .eq('user_id', user.id)
        .single();

      const plan = (membership?.organizations as any)?.plan_type || 'free';
      setUserPlan(plan as 'free' | 'lite' | 'pro');
      
      await loadFeaturesForPlan(plan as 'free' | 'lite' | 'pro');
    } catch (error) {
      console.error('Error fetching feature access:', error);
      // Default to free tier on error
      await loadFeaturesForPlan('free');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturesForPlan = async (plan: 'free' | 'lite' | 'pro') => {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('feature, enabled')
      .eq('plan', plan)
      .eq('enabled', true);

    if (error) {
      console.error('Error loading features:', error);
      return;
    }

    const featureMap: FeatureFlags = {};
    data?.forEach(item => {
      featureMap[item.feature] = item.enabled;
    });
    
    setFeatures(featureMap);
  };

  const canAccess = (feature: string): boolean => {
    return features[feature] === true;
  };

  const requiresUpgrade = (feature: string): boolean => {
    return !canAccess(feature);
  };

  return {
    canAccess,
    requiresUpgrade,
    features,
    loading,
    userPlan,
    refresh: fetchFeatureAccess
  };
}
