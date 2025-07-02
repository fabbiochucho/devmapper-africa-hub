
-- Create partners table to store partner logo information
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partners table
CREATE POLICY "Anyone can view active partners"
  ON public.partners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform admins can manage all partners"
  ON public.partners
  FOR ALL
  USING (public.has_role(auth.uid(), 'Platform Admin'));

-- Insert initial partner data
INSERT INTO public.partners (name, logo_url, website_url, display_order) VALUES
('Office of the Senior Special Assistant to The President on SDGs', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=100&fit=crop', '#', 1),
('Special Adviser on Climate Change and Circular Economy to the Governor of Lagos State', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=100&fit=crop', '#', 2),
('Nigerian Sustainable Banking Principles', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=200&h=100&fit=crop', '#', 3),
('United Nations Global Compact Network', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=100&fit=crop', '#', 4);
