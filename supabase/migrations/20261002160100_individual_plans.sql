-- Individual / Professional tier: a plan that belongs to a person, not an organisation,
-- for researchers, journalists, consultants and analysts.
--
-- * user_plans       - one row per user with a paid (or granted) individual plan.
-- * effective_plan() - the single answer to "what can this user use": the best of their
--                      organisation's plan, an individual plan, or an approved scholarship.
-- * can_access_feature() now uses it, so individual plans and scholarships unlock features.

CREATE TABLE public.user_plans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.plan_type NOT NULL DEFAULT 'individual',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  source text NOT NULL CHECK (source IN ('paystack', 'flutterwave', 'admin')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own plan" ON public.user_plans FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins manage individual plans" ON public.user_plans FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'platform_admin'))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'platform_admin'));
-- Payment webhooks write with the service role.
REVOKE ALL ON public.user_plans FROM anon;

-- Individual payments are billed to a person.
ALTER TABLE public.billing_events ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE public.billing_events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_payer_check CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.plan_rank(p text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p WHEN 'lite' THEN 1 WHEN 'individual' THEN 2 WHEN 'pro' THEN 3 WHEN 'advanced' THEN 4 WHEN 'enterprise' THEN 5 ELSE 0 END
$$;

-- Internal: no caller check (used by can_access_feature and other definer functions).
CREATE OR REPLACE FUNCTION public._effective_plan(p_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT p FROM (
      SELECT 'enterprise'::text AS p
        WHERE has_role(p_user_id, 'admin') OR has_role(p_user_id, 'platform_admin')
      UNION ALL
      SELECT COALESCE(o.scholarship_override, o.plan_type::text)
        FROM public.organization_members om JOIN public.organizations o ON o.id = om.organization_id
        WHERE om.user_id = p_user_id
      UNION ALL
      SELECT up.plan::text FROM public.user_plans up WHERE up.user_id = p_user_id AND up.expires_at > now()
      UNION ALL
      SELECT s.requested_plan FROM public.scholarships s
        WHERE s.user_id = p_user_id AND s.status = 'approved' AND (s.expires_at IS NULL OR s.expires_at > now())
    ) c
    WHERE p IS NOT NULL
    ORDER BY public.plan_rank(p) DESC
    LIMIT 1
  ), 'free')
$$;
REVOKE EXECUTE ON FUNCTION public._effective_plan(uuid) FROM PUBLIC, anon, authenticated;

-- Public: a user may ask about themselves; admins about anyone.
CREATE OR REPLACE FUNCTION public.effective_plan(p_user_id uuid DEFAULT NULL)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid := COALESCE(p_user_id, auth.uid());
BEGIN
  IF target IS NULL THEN RETURN 'free'; END IF;
  IF target <> auth.uid() AND NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin')) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN public._effective_plan(target);
END $$;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated;

-- Feature gates follow the effective plan and include every lower tier's features.
CREATE OR REPLACE FUNCTION public.can_access_feature(p_user_id uuid, p_feature text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rank int := public.plan_rank(public._effective_plan(p_user_id));
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.feature_flags f
    WHERE f.feature = p_feature AND f.enabled AND public.plan_rank(f.plan::text) <= v_rank
  );
END $$;

-- What the Individual plan adds over Lite: exports, full earth intelligence, benchmark data,
-- and higher Ndovu Akili limits (enforced in ndovu-orchestrator).
INSERT INTO public.feature_flags (plan, feature, enabled)
SELECT 'individual', f, true FROM unnest(ARRAY['export_reports', 'export_analytics', 'full_earth_intelligence', 'benchmark_data', 'investigation_export']) f
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE plan = 'individual' AND feature = f);
