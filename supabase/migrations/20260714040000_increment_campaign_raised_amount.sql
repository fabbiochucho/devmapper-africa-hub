-- Donations flip campaign_donations.status to 'completed' but nothing ever
-- incremented fundraising_campaigns.raised_amount - confirmed via grep
-- across all migrations/functions, and a later migration's own comment
-- (20260710160000_cron_refresh_dashboard_stats.sql) assumed this increment
-- already happened, when it never did. A plain client-side
-- .update({raised_amount: x}) would be unsafe under concurrent donations
-- (read-then-write race) - this RPC does the increment atomically in SQL.
CREATE OR REPLACE FUNCTION public.increment_campaign_raised_amount(p_campaign_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.fundraising_campaigns
  SET raised_amount = raised_amount + p_amount
  WHERE id = p_campaign_id;
$$;
