-- CMS Content table for static pages
CREATE TABLE public.cms_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,  -- e.g., 'training', 'resources', 'support', 'about', 'contact'
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',  -- Flexible content structure
  meta jsonb DEFAULT '{}',  -- SEO metadata
  is_published boolean DEFAULT true,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CMS Content Sections for modular content blocks
CREATE TABLE public.cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  section_key text NOT NULL,
  title text,
  content jsonb NOT NULL DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_key, section_key)
);

-- Admin broadcast messages
CREATE TABLE public.admin_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  subject text NOT NULL,
  message text NOT NULL,
  recipient_type text NOT NULL,  -- 'all', 'role:ngo_member', 'role:company_representative', etc.
  recipient_ids uuid[] DEFAULT '{}',  -- For individual messages
  priority text DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
  is_read_by jsonb DEFAULT '[]',  -- Array of user_ids who have read
  created_at timestamptz DEFAULT now()
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  subject text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',  -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_content
CREATE POLICY "CMS content viewable by everyone" ON public.cms_content
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage CMS content" ON public.cms_content
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- RLS Policies for cms_sections
CREATE POLICY "CMS sections viewable by everyone" ON public.cms_sections
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can manage CMS sections" ON public.cms_sections
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- RLS Policies for admin_broadcasts
CREATE POLICY "Users can view broadcasts targeted to them" ON public.admin_broadcasts
  FOR SELECT USING (
    recipient_type = 'all' OR
    auth.uid() = ANY(recipient_ids) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'platform_admin'::app_role) OR
    (recipient_type LIKE 'role:%' AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role::text = substring(recipient_type from 6)
      AND is_active = true
    ))
  );

CREATE POLICY "Admins can create broadcasts" ON public.admin_broadcasts
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

CREATE POLICY "Admins can update broadcasts" ON public.admin_broadcasts
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own open tickets" ON public.support_tickets
  FOR UPDATE USING (user_id = auth.uid() AND status = 'open');

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- Update triggers
CREATE TRIGGER update_cms_content_updated_at
  BEFORE UPDATE ON public.cms_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_sections_updated_at
  BEFORE UPDATE ON public.cms_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();