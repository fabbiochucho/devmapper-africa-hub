
-- Multi-location table for companies and NGOs
CREATE TABLE public.entity_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'ngo')),
  country TEXT NOT NULL,
  country_code TEXT,
  city TEXT,
  address TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Government administrative levels
CREATE TABLE public.admin_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('ward', 'district', 'state', 'country')),
  parent_id UUID REFERENCES public.admin_areas(id),
  country_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add admin_area_id to government_projects
ALTER TABLE public.government_projects ADD COLUMN IF NOT EXISTS admin_area_id UUID REFERENCES public.admin_areas(id);

-- RLS for entity_locations
ALTER TABLE public.entity_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own locations"
  ON public.entity_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all locations"
  ON public.entity_locations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- RLS for admin_areas (public read, admin write)
ALTER TABLE public.admin_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin areas are viewable by everyone"
  ON public.admin_areas FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage admin areas"
  ON public.admin_areas FOR ALL
  USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any profile (for admin user edit)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
