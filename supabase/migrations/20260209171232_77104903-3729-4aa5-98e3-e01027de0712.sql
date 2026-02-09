-- Fix partner management RLS policies to allow admins to manage partners
DROP POLICY IF EXISTS "Only admins can insert partners" ON public.partners;
DROP POLICY IF EXISTS "Only admins can update partners" ON public.partners;
DROP POLICY IF EXISTS "Only admins can delete partners" ON public.partners;

CREATE POLICY "Admins can insert partners" ON public.partners
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Admins can update partners" ON public.partners
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Admins can delete partners" ON public.partners
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));