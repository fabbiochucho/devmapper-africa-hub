-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policies for partners (public read, admin only write)
CREATE POLICY "Partners are viewable by everyone" 
ON public.partners 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert partners" 
ON public.partners 
FOR INSERT 
WITH CHECK (false); -- Will be updated when we have proper admin roles

CREATE POLICY "Only admins can update partners" 
ON public.partners 
FOR UPDATE 
USING (false); -- Will be updated when we have proper admin roles

CREATE POLICY "Only admins can delete partners" 
ON public.partners 
FOR DELETE 
USING (false); -- Will be updated when we have proper admin roles

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization TEXT,
  country TEXT,
  phone TEXT,
  bio TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user roles enum and table
CREATE TYPE public.app_role as enum ('admin', 'ngo_member', 'government_official', 'company_representative', 'country_admin', 'platform_admin', 'change_maker', 'citizen_reporter');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  organization TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, organization)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'platform_admin'));

-- Create fundraising campaigns table
CREATE TABLE public.fundraising_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  change_maker_id UUID REFERENCES public.profiles(user_id),
  target_amount DECIMAL(12,2) NOT NULL,
  raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  sdg_goals INTEGER[] NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('nano', 'micro', 'small')),
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for campaigns
CREATE POLICY "Campaigns are viewable by everyone" 
ON public.fundraising_campaigns 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create campaigns" 
ON public.fundraising_campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns" 
ON public.fundraising_campaigns 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create campaign donations table
CREATE TABLE public.campaign_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  anonymous BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_donations ENABLE ROW LEVEL SECURITY;

-- Create policies for donations
CREATE POLICY "Campaign creators can view donations to their campaigns" 
ON public.campaign_donations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fundraising_campaigns 
    WHERE id = campaign_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Donors can view their own donations" 
ON public.campaign_donations 
FOR SELECT 
USING (auth.uid() = donor_id);

-- Create SDG Agenda 2063 alignment table
CREATE TABLE public.sdg_agenda2063_alignment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sdg_goal INTEGER NOT NULL,
  sdg_target TEXT NOT NULL,
  agenda2063_goal TEXT NOT NULL,
  agenda2063_aspiration TEXT NOT NULL,
  alignment_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert SDG-Agenda 2063 alignments based on au.int/en/agenda2063/sdgs
INSERT INTO public.sdg_agenda2063_alignment (sdg_goal, sdg_target, agenda2063_goal, agenda2063_aspiration, alignment_description) VALUES
(1, 'End poverty in all its forms everywhere', 'Goal 1: A high standard of living for all', 'Aspiration 1: A prosperous Africa', 'Poverty eradication aligns with Africa''s aspiration for prosperity and high living standards'),
(2, 'End hunger, achieve food security', 'Goal 5: Modern agriculture for productivity', 'Aspiration 1: A prosperous Africa', 'Food security through agricultural transformation'),
(3, 'Ensure healthy lives and well-being', 'Goal 3: Healthy and well-nourished citizens', 'Aspiration 1: A prosperous Africa', 'Health and well-being for all Africans'),
(4, 'Ensure inclusive and equitable quality education', 'Goal 2: Well-educated citizens and skills revolution', 'Aspiration 6: An Africa whose development is people-driven', 'Education as foundation for human development'),
(5, 'Achieve gender equality', 'Goal 17: Full gender equality', 'Aspiration 6: An Africa whose development is people-driven', 'Women and girls as equal partners in development'),
(6, 'Ensure availability of water and sanitation', 'Goal 1: A high standard of living for all', 'Aspiration 1: A prosperous Africa', 'Access to clean water and sanitation for all'),
(7, 'Ensure access to affordable, reliable energy', 'Goal 6: Blue/Ocean economy for accelerated growth', 'Aspiration 1: A prosperous Africa', 'Sustainable energy for development'),
(8, 'Promote sustained, inclusive economic growth', 'Goal 4: Transformed economies and job creation', 'Aspiration 1: A prosperous Africa', 'Economic transformation and job creation'),
(9, 'Build resilient infrastructure', 'Goal 9: World-class infrastructure', 'Aspiration 2: An integrated continent', 'Infrastructure for connectivity and development'),
(10, 'Reduce inequality within and among countries', 'Goal 1: A high standard of living for all', 'Aspiration 1: A prosperous Africa', 'Inclusive growth and reduced inequalities'),
(11, 'Make cities inclusive, safe, resilient', 'Goal 7: Environmentally sustainable cities', 'Aspiration 1: A prosperous Africa', 'Sustainable urban development'),
(12, 'Ensure sustainable consumption patterns', 'Goal 7: Environmentally sustainable climate resilient economies', 'Aspiration 1: A prosperous Africa', 'Sustainable resource management'),
(13, 'Take urgent action on climate change', 'Goal 7: Environmentally sustainable climate resilient economies', 'Aspiration 1: A prosperous Africa', 'Climate resilience and adaptation'),
(14, 'Conserve and use oceans sustainably', 'Goal 6: Blue/Ocean economy', 'Aspiration 1: A prosperous Africa', 'Marine resource management'),
(15, 'Protect and restore terrestrial ecosystems', 'Goal 7: Environmentally sustainable climate resilient economies', 'Aspiration 1: A prosperous Africa', 'Biodiversity conservation and ecosystem management'),
(16, 'Promote peaceful and inclusive societies', 'Goal 13: Peace, security and stability', 'Aspiration 4: A peaceful and secure Africa', 'Governance, peace and security'),
(17, 'Strengthen means of implementation', 'Goal 20: Africa takes responsibility for financing development', 'Aspiration 7: Africa as a strong, united, resilient and influential global player', 'African ownership of development financing');

-- Create corporate targets table
CREATE TABLE public.corporate_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.profiles(user_id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sdg_goals INTEGER[] NOT NULL,
  target_value DECIMAL(12,2),
  current_value DECIMAL(12,2) DEFAULT 0,
  unit TEXT,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_track', 'at_risk', 'delayed')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corporate_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for corporate targets
CREATE POLICY "Public targets are viewable by everyone" 
ON public.corporate_targets 
FOR SELECT 
USING (visibility = 'public');

CREATE POLICY "Companies can view their own targets" 
ON public.corporate_targets 
FOR SELECT 
USING (auth.uid() = company_id);

CREATE POLICY "Companies can create targets" 
ON public.corporate_targets 
FOR INSERT 
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own targets" 
ON public.corporate_targets 
FOR UPDATE 
USING (auth.uid() = company_id);

-- Create government projects table
CREATE TABLE public.government_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  government_id UUID NOT NULL REFERENCES public.profiles(user_id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sdg_goals INTEGER[] NOT NULL,
  budget DECIMAL(15,2),
  spent_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'suspended', 'cancelled')),
  location TEXT,
  beneficiaries INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.government_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for government projects
CREATE POLICY "Public projects are viewable by everyone" 
ON public.government_projects 
FOR SELECT 
USING (visibility = 'public');

CREATE POLICY "Government users can view their own projects" 
ON public.government_projects 
FOR SELECT 
USING (auth.uid() = government_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.fundraising_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_targets_updated_at
  BEFORE UPDATE ON public.corporate_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_government_projects_updated_at
  BEFORE UPDATE ON public.government_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default citizen_reporter role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen_reporter');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();