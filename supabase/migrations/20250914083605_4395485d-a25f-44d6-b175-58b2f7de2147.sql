-- Fix foreign key relationships and add missing tables/features
-- Add storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false),
  ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for file uploads
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Document storage policies
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Project files policies
CREATE POLICY "Project files are accessible to organization members" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-files' AND EXISTS (
  SELECT 1 FROM organizations o
  WHERE o.id = (storage.foldername(name))[1]
  AND (o.created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = o.id AND om.user_id = auth.uid()
  ))
));

CREATE POLICY "Organization members can upload project files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-files' AND EXISTS (
  SELECT 1 FROM organizations o
  WHERE o.id = (storage.foldername(name))[1]
  AND (o.created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = o.id AND om.user_id = auth.uid()
  ))
));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE change_makers;
ALTER PUBLICATION supabase_realtime ADD TABLE fundraising_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE forum_post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE billing_events;

-- Add replica identity for realtime
ALTER TABLE reports REPLICA IDENTITY FULL;
ALTER TABLE change_makers REPLICA IDENTITY FULL;
ALTER TABLE fundraising_campaigns REPLICA IDENTITY FULL;
ALTER TABLE forum_posts REPLICA IDENTITY FULL;
ALTER TABLE forum_post_likes REPLICA IDENTITY FULL;
ALTER TABLE organizations REPLICA IDENTITY FULL;
ALTER TABLE billing_events REPLICA IDENTITY FULL;

-- Create analytics tables for advanced analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  event_type TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics RLS policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Performance optimization: Add indexes
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_sdg_goal ON reports(sdg_goal);
CREATE INDEX IF NOT EXISTS idx_reports_country_code ON reports(country_code);
CREATE INDEX IF NOT EXISTS idx_change_makers_user_id ON change_makers(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

-- Add materialized view for performance optimization
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM change_makers) as total_change_makers,
  (SELECT COUNT(*) FROM fundraising_campaigns) as total_campaigns,
  (SELECT SUM(raised_amount) FROM fundraising_campaigns) as total_funds_raised,
  (SELECT COUNT(DISTINCT country_code) FROM reports WHERE country_code IS NOT NULL) as countries_count,
  NOW() as last_updated;

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);