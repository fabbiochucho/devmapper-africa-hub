-- ============================================================
-- FIX: "Security Definer View" finding (public_profiles), done safely.
-- ============================================================
-- public_profiles was a VIEW over profiles. Several past migrations set
-- security_invoker=true on it, but the live database showed
-- security_invoker=false regardless - a later `CREATE OR REPLACE VIEW`
-- silently dropped that reloption (a real Postgres gotcha: reloptions
-- are not preserved across CREATE OR REPLACE unless re-specified).
--
-- Flipping security_invoker=true is NOT a safe fix here. Doing so would
-- require a permissive "any authenticated user can view any profile"
-- RLS policy on the base `profiles` table so the view (now subject to
-- the *querying* user's RLS) can still see other users' rows. But
-- `profiles` also has `email` and `phone` columns - real PII this view
-- never exposes. RLS is row-level only; it cannot be scoped to "only
-- these columns, only through this view." That policy would apply
-- equally to a direct query like `supabase.from('profiles').select
-- ('email')`, letting any signed-in user harvest every other user's
-- email and phone number - a phishing/spam-list vulnerability strictly
-- worse than the finding it would supposedly fix.
--
-- Correct fix: replace the view with a genuine TABLE holding only the
-- always-safe columns, kept current via a trigger on `profiles`. Since
-- email/phone can never physically exist in this table, no RLS policy
-- on it - however permissive - can ever leak them, now or if someone
-- carelessly loosens the policy later. Kept the same name and column
-- set as the old view so no client query changes: direct
-- `.from('public_profiles')` reads (SearchPage, Forum, useMessages,
-- task-assignees) and PostgREST embeds like
-- `public_profiles!fundraising_campaigns_created_by_fkey(full_name)`
-- (AdminDashboard, Fundraising) all keep working via user_id's real FK
-- to auth.users below.
-- ============================================================

DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE public.public_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id UUID NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization TEXT,
  country TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.public_profiles IS
  'Synced, intentionally-public projection of profiles. SECURITY INVARIANT: '
  'never add email, phone, or any other non-public column to this table - '
  'its whole safety property is that sensitive columns cannot exist here, '
  'regardless of how permissive its RLS policy is. Kept current by '
  'sync_public_profile() trigger on public.profiles.';

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Safe by construction (see table comment above) - /search is a public
-- route (unauthenticated visitors can search), matching the old view's
-- anon+authenticated grant.
CREATE POLICY "Anyone can view the public profile directory"
ON public.public_profiles FOR SELECT
USING (true);

-- New tables in this schema pick up default INSERT/UPDATE/DELETE grants
-- for `authenticated` (confirmed live) - RLS above already blocks those
-- (only a SELECT policy exists), but revoke explicitly rather than
-- relying on RLS alone to enforce read-only access.
REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_profiles (user_id, id, full_name, avatar_url, organization, country, is_verified, created_at)
  VALUES (NEW.user_id, NEW.id, NEW.full_name, NEW.avatar_url, NEW.organization, NEW.country, NEW.is_verified, NEW.created_at)
  ON CONFLICT (user_id) DO UPDATE SET
    id = EXCLUDED.id,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    organization = EXCLUDED.organization,
    country = EXCLUDED.country,
    is_verified = EXCLUDED.is_verified,
    created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_profile_trigger ON public.profiles;
CREATE TRIGGER sync_public_profile_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

-- Backfill existing rows (the trigger only fires on future profiles changes).
INSERT INTO public.public_profiles (user_id, id, full_name, avatar_url, organization, country, is_verified, created_at)
SELECT user_id, id, full_name, avatar_url, organization, country, is_verified, created_at
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
