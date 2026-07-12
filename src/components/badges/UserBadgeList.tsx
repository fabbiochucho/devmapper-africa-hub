import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileCheck, ShieldCheck, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TIER_CONFIG = {
  trainer: { label: 'Trainer', icon: GraduationCap, className: 'bg-purple-500/10 text-purple-600' },
  verifier: { label: 'Verifier', icon: ShieldCheck, className: 'bg-green-500/10 text-green-600' },
  reporter: { label: 'Reporter', icon: FileCheck, className: 'bg-blue-500/10 text-blue-600' },
} as const;

type BadgeTier = keyof typeof TIER_CONFIG;

// Highest-value tier first when space is limited.
const TIER_ORDER: BadgeTier[] = ['trainer', 'verifier', 'reporter'];

/**
 * Small inline badge row for a user's earned reputation tiers
 * (public.user_badges, awarded automatically - see the
 * 20260712010000_badge_reputation_system migration). Renders nothing for a
 * user with no badges yet, rather than an empty-state placeholder.
 */
export function UserBadgeList({ userId, max = 3 }: { userId: string | null | undefined; max?: number }) {
  const [tiers, setTiers] = useState<BadgeTier[]>([]);

  useEffect(() => {
    if (!userId) {
      setTiers([]);
      return;
    }
    supabase
      .from('user_badges')
      .select('badge_tier')
      .eq('user_id', userId)
      .then(({ data }) => setTiers((data ?? []).map((d) => d.badge_tier as BadgeTier)));
  }, [userId]);

  const ordered = TIER_ORDER.filter((t) => tiers.includes(t)).slice(0, max);
  if (ordered.length === 0) return null;

  return (
    <>
      {ordered.map((tier) => {
        const cfg = TIER_CONFIG[tier];
        const Icon = cfg.icon;
        return (
          <Badge key={tier} variant="outline" className={`text-xs gap-1 border-0 ${cfg.className}`}>
            <Icon className="h-3 w-3" />{cfg.label}
          </Badge>
        );
      })}
    </>
  );
}
