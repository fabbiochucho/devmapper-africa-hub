
DROP POLICY "Users can update conversations they created" ON public.conversations;
CREATE POLICY "Users can update conversations they created" ON public.conversations
  FOR UPDATE USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY "Companies can update their own targets" ON public.corporate_targets;
CREATE POLICY "Companies can update their own targets" ON public.corporate_targets
  FOR UPDATE USING ((SELECT auth.uid()) = company_id)
  WITH CHECK ((SELECT auth.uid()) = company_id);

DROP POLICY "Users can update their own campaigns" ON public.fundraising_campaigns;
CREATE POLICY "Users can update their own campaigns" ON public.fundraising_campaigns
  FOR UPDATE USING ((SELECT auth.uid()) = created_by)
  WITH CHECK (
    (SELECT auth.uid()) = created_by
    AND is_verified IS NOT DISTINCT FROM (SELECT is_verified FROM public.fundraising_campaigns fc WHERE fc.id = fundraising_campaigns.id)
    AND raised_amount IS NOT DISTINCT FROM (SELECT raised_amount FROM public.fundraising_campaigns fc WHERE fc.id = fundraising_campaigns.id)
  );

DROP POLICY "Government officials can update their own projects" ON public.government_projects;
CREATE POLICY "Government officials can update their own projects" ON public.government_projects
  FOR UPDATE USING ((SELECT auth.uid()) = government_id)
  WITH CHECK ((SELECT auth.uid()) = government_id);
