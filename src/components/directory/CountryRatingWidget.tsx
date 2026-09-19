import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { responsibilityAreas } from "@/data/responsibilityAreas";

interface CountryRatingWidgetProps {
  countryCode: string;
  onRated?: () => void;
}

const RATING_VALUES = [1, 2, 3, 4, 5];

const CountryRatingWidget = ({ countryCode, onRated }: CountryRatingWidgetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
        Sign in to rate this country
      </Button>
    );
  }

  const filledCount = Object.values(ratings).filter(Boolean).length;

  const handleSubmit = async () => {
    if (filledCount === 0) {
      toast.error('Rate at least one category before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, number> = {};
      for (const area of responsibilityAreas) {
        if (ratings[area.value]) payload[area.value] = Number(ratings[area.value]);
      }
      const { error } = await supabase.from('country_ratings').insert({
        rater_id: user.id,
        country_code: countryCode,
        ...payload,
      });
      if (error) {
        // UNIQUE(rater_id, country_code, rating_period) violation - the
        // server-enforced once-a-month cap, not a generic failure.
        if (error.code === '23505') {
          toast.error("You've already rated this country this month.");
        } else {
          throw error;
        }
        return;
      }
      toast.success('Thanks for rating this country!');
      setRatings({});
      onRated?.();
    } catch (e) {
      console.error('Country rating submission failed:', e);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Rate any categories you have an opinion on - partial ratings count, once per month.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {responsibilityAreas.map((area) => (
          <div key={area.value} className="space-y-1">
            <Label className="text-xs">{area.label}</Label>
            <Select value={ratings[area.value] || ''} onValueChange={(v) => setRatings((r) => ({ ...r, [area.value]: v }))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Not rated" />
              </SelectTrigger>
              <SelectContent>
                {RATING_VALUES.map((v) => (
                  <SelectItem key={v} value={String(v)}>{v} / 5</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <Button size="sm" disabled={submitting || filledCount === 0} onClick={handleSubmit}>
        {submitting ? 'Submitting…' : `Submit rating (${filledCount}/${responsibilityAreas.length})`}
      </Button>
    </div>
  );
};

export default CountryRatingWidget;
