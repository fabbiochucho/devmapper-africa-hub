-- Create reports table to store project reports
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  sdg_goal integer NOT NULL,
  project_status text NOT NULL DEFAULT 'planned',
  cost numeric,
  beneficiaries integer,
  country_code text,
  location text,
  lat numeric,
  lng numeric,
  evidence_url text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_verified boolean DEFAULT false,
  verification_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Reports are viewable by everyone" 
ON public.reports 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can delete reports" 
ON public.reports 
FOR DELETE 
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create change_makers table
CREATE TABLE public.change_makers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  sdg_goals integer[] NOT NULL,
  location text NOT NULL,
  country_code text,
  projects_count integer DEFAULT 0,
  total_funding numeric DEFAULT 0,
  impact_description text,
  image_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.change_makers ENABLE ROW LEVEL SECURITY;

-- Create policies for change_makers
CREATE POLICY "Change makers are viewable by everyone" 
ON public.change_makers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own change maker profile" 
ON public.change_makers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own change maker profile" 
ON public.change_makers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create verification_logs table
CREATE TABLE public.verification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for verification_logs
CREATE POLICY "Verifications are viewable by everyone" 
ON public.verification_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create verifications" 
ON public.verification_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_change_makers_updated_at
  BEFORE UPDATE ON public.change_makers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.reports (title, description, sdg_goal, project_status, cost, beneficiaries, country_code, location, lat, lng) VALUES
('Solar Panel Installation', 'Installing solar panels in rural schools', 7, 'in_progress', 50000, 500, 'KE', 'Nairobi, Kenya', -1.2921, 36.8219),
('Water Well Project', 'Building clean water wells in communities', 6, 'completed', 25000, 1000, 'GH', 'Accra, Ghana', 5.6037, -0.1870),
('Education Program', 'Literacy program for children', 4, 'planned', 15000, 300, 'NG', 'Lagos, Nigeria', 6.5244, 3.3792);

INSERT INTO public.change_makers (title, description, sdg_goals, location, country_code, projects_count, total_funding, impact_description, image_url) VALUES
('Education Advocate', 'Empowering communities through education and literacy programs', '{4,5,10}', 'Lagos, Nigeria', 'NG', 12, 125000, '50,000+ lives touched', '/placeholder.svg'),
('Clean Water Champion', 'Providing access to clean water and sanitation', '{6,3,1}', 'Nairobi, Kenya', 'KE', 8, 89000, '25 communities served', '/placeholder.svg'),
('Climate Action Leader', 'Environmental conservation and renewable energy projects', '{13,7,15}', 'Accra, Ghana', 'GH', 15, 156000, '500+ trees planted', '/placeholder.svg');