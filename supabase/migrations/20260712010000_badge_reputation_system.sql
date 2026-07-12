-- #115: Badge & Reputation System. Three tiers, each backed by data that
-- already exists rather than a new manual-award workflow:
--   Reporter — at least one of the user's own reports has been verified
--     (reports.is_verified, the same flag ProjectDetail.tsx already reads).
--   Verifier — verifier_profiles.verification_count >= 10 (the counter the
--     Verifier Marketplace leaderboard already displays).
--   Trainer  — verification_count >= 50 AND is_certified = true. Reusing
--     is_certified (the existing admin-toggle on verifier_profiles) as the
--     "admin-nominated" signal, rather than inventing a second nomination
--     mechanism when this one already exists and means exactly that.
-- Badges are evaluated by triggers, not client code, so they can't be
-- self-awarded and stay correct regardless of which UI path changed the
-- underlying counters.

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_tier TEXT NOT NULL CHECK (badge_tier IN ('reporter', 'verifier', 'trainer')),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_tier)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Badges are public reputation signals (same visibility policy as
-- verifier_profiles and public_profiles) - no write policy at all, since
-- every write happens through the SECURITY DEFINER function below.
CREATE POLICY "Anyone can view badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE OR REPLACE FUNCTION public.evaluate_user_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.reports WHERE user_id = p_user_id AND is_verified = true) THEN
    INSERT INTO public.user_badges (user_id, badge_tier) VALUES (p_user_id, 'reporter')
    ON CONFLICT (user_id, badge_tier) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM public.verifier_profiles WHERE user_id = p_user_id AND verification_count >= 10) THEN
    INSERT INTO public.user_badges (user_id, badge_tier) VALUES (p_user_id, 'verifier')
    ON CONFLICT (user_id, badge_tier) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM public.verifier_profiles WHERE user_id = p_user_id AND verification_count >= 50 AND is_certified = true) THEN
    INSERT INTO public.user_badges (user_id, badge_tier) VALUES (p_user_id, 'trainer')
    ON CONFLICT (user_id, badge_tier) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_evaluate_reporter_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_verified = true THEN
    PERFORM public.evaluate_user_badges(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reports_evaluate_badges
AFTER INSERT OR UPDATE OF is_verified ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.trg_evaluate_reporter_badge();

CREATE OR REPLACE FUNCTION public.trg_evaluate_verifier_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.evaluate_user_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_verifier_profiles_evaluate_badges
AFTER INSERT OR UPDATE OF verification_count, is_certified ON public.verifier_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_evaluate_verifier_badge();
