-- Fix campaign_donations RLS to allow anonymous donations (where donor_id can be null)
DROP POLICY IF EXISTS "Users can create campaign donations" ON public.campaign_donations;

CREATE POLICY "Users can create campaign donations" ON public.campaign_donations
  FOR INSERT WITH CHECK (
    (auth.uid() = donor_id) OR (donor_id IS NULL AND auth.uid() IS NOT NULL)
  );