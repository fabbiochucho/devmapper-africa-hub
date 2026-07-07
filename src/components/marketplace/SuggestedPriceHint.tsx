import { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { getSuggestedPrice, type SuggestedPriceRange } from '@/lib/marketplace-pricing';

interface SuggestedPriceHintProps {
  projectType: string;
  countryCode: string;
  vintageYear: number;
  organizationId?: string;
}

/**
 * Non-blocking benchmark-driven price suggestion for the "Create Listing"
 * form. Purely informational — the seller always sets the final
 * price_per_tonne themselves; this never writes anything.
 */
export function SuggestedPriceHint({ projectType, countryCode, vintageYear, organizationId }: SuggestedPriceHintProps) {
  const [range, setRange] = useState<SuggestedPriceRange | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!countryCode || countryCode.trim().length < 2) {
      setRange(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getSuggestedPrice({ projectType, countryCode: countryCode.toUpperCase(), vintageYear }, organizationId)
      .then((result) => {
        if (!cancelled) setRange(result);
      })
      .catch(() => {
        if (!cancelled) setRange(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectType, countryCode, vintageYear, organizationId]);

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking suggested pricing…
      </p>
    );
  }

  if (!range) return null;

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Sparkles className="h-3 w-3 text-primary" />
      Suggested: ${range.low.toFixed(2)}–${range.high.toFixed(2)}/tCO2e (benchmark: {range.source}, confidence {(range.confidence * 100).toFixed(0)}%) — you set the final price.
    </p>
  );
}
