-- 1. Citizen progress voting table
CREATE TABLE public.feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.citizen_project_feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.feedback_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.feedback_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON public.feedback_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON public.feedback_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Auto-refresh dashboard stats trigger on report insert/update/delete
CREATE OR REPLACE FUNCTION public.trigger_refresh_dashboard_stats()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.refresh_dashboard_stats();
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_refresh_stats_on_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_dashboard_stats();

CREATE TRIGGER trg_refresh_stats_on_change_makers
  AFTER INSERT OR DELETE ON public.change_makers
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_dashboard_stats();

CREATE TRIGGER trg_refresh_stats_on_campaigns
  AFTER INSERT OR DELETE ON public.fundraising_campaigns
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_dashboard_stats();