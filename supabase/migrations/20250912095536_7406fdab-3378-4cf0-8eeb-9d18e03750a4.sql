-- Create organizations table for billing management
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'lite' CHECK (plan_type IN ('lite', 'pro')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their organizations" 
ON public.organizations 
FOR UPDATE 
USING (created_by = auth.uid());

-- Create organization members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create policies for organization members
CREATE POLICY "Users can view memberships for their organizations" 
ON public.organization_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id AND created_by = auth.uid()
  )
);

-- Create billing events table for tracking plan changes
CREATE TABLE public.billing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('upgrade', 'downgrade', 'payment', 'refund')),
  old_plan TEXT,
  new_plan TEXT,
  provider TEXT CHECK (provider IN ('stripe', 'paystack')),
  external_id TEXT,
  amount DECIMAL,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Create policies for billing events
CREATE POLICY "Organization owners can view billing events" 
ON public.billing_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id AND created_by = auth.uid()
  )
);

-- Create updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample organization for testing
INSERT INTO public.organizations (name, plan_type, created_by) 
SELECT 'Sample Organization', 'lite', id 
FROM auth.users 
LIMIT 1;