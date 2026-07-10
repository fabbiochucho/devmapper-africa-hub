-- Phase 1: Database Security Fixes
-- Enable RLS on sdg_agenda2063_alignment table
ALTER TABLE public.sdg_agenda2063_alignment ENABLE ROW LEVEL SECURITY;

-- Create read policies for sdg_agenda2063_alignment (public read access for educational content)
CREATE POLICY "SDG-Agenda 2063 alignments are viewable by everyone"
ON public.sdg_agenda2063_alignment
FOR SELECT
USING (true);

-- Create admin-only policies for sdg_agenda2063_alignment management
CREATE POLICY "Only admins can insert SDG-Agenda 2063 alignments"
ON public.sdg_agenda2063_alignment
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Only admins can update SDG-Agenda 2063 alignments"
ON public.sdg_agenda2063_alignment
FOR UPDATE
USING (has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Only admins can delete SDG-Agenda 2063 alignments"
ON public.sdg_agenda2063_alignment
FOR DELETE
USING (has_role(auth.uid(), 'platform_admin'));

-- Fix missing policies for user_roles table (admin-only operations)
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'));

-- Add missing CRUD policies for campaign_donations
CREATE POLICY "Users can create campaign donations"
ON public.campaign_donations
FOR INSERT
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Campaign creators and donors can update donations"
ON public.campaign_donations
FOR UPDATE
USING (
  auth.uid() = donor_id OR
  EXISTS (
    SELECT 1 FROM fundraising_campaigns
    WHERE id = campaign_donations.campaign_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Only admins can delete donations"
ON public.campaign_donations
FOR DELETE
USING (has_role(auth.uid(), 'platform_admin'));

-- Add missing CRUD policies for government_projects
CREATE POLICY "Government officials can create their own projects"
ON public.government_projects
FOR INSERT
WITH CHECK (auth.uid() = government_id);

CREATE POLICY "Government officials can update their own projects"
ON public.government_projects
FOR UPDATE
USING (auth.uid() = government_id);

CREATE POLICY "Government officials can delete their own projects"
ON public.government_projects
FOR DELETE
USING (auth.uid() = government_id);

-- Add validation trigger to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION validate_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent self-assignment of admin roles unless already admin
  IF NEW.role IN ('platform_admin', 'admin') AND NEW.user_id = auth.uid() THEN
    IF NOT (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Cannot self-assign admin roles';
    END IF;
  END IF;

  -- Ensure only admins can assign admin roles
  IF NEW.role IN ('platform_admin', 'admin') THEN
    IF NOT (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_assignment();

-- Phase 3: Fix database function security
-- Update existing function to have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$function$;

-- Update handle_new_user function to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');

  -- Assign default citizen_reporter role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen_reporter');

  RETURN NEW;
END;
$function$;
