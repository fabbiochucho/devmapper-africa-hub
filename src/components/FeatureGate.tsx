import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
  feature: string;
  requiredPlan?: 'lite' | 'pro';
  children: ReactNode;
  fallback?: ReactNode;
  showPrompt?: boolean;
}

export default function FeatureGate({
  feature,
  requiredPlan = 'lite',
  children,
  fallback,
  showPrompt = true
}: FeatureGateProps) {
  const { canAccess, loading, isAdmin } = useFeatureAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admins always bypass feature gates
  if (isAdmin || canAccess(feature)) {
    return <>{children}</>;
  }

  if (showPrompt) {
    return <UpgradePrompt feature={feature} requiredPlan={requiredPlan} />;
  }
  return fallback ? <>{fallback}</> : null;
}
