
-- 1. Create notifications table for real event-driven notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System and admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Notification trigger for citizen feedback
CREATE OR REPLACE FUNCTION public.notify_on_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_report_owner UUID;
  v_report_title TEXT;
BEGIN
  SELECT user_id, title INTO v_report_owner, v_report_title
  FROM public.reports WHERE id = NEW.report_id;
  
  IF v_report_owner IS NOT NULL AND v_report_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      v_report_owner,
      CASE WHEN NEW.is_issue_report THEN 'warning' ELSE 'info' END,
      CASE WHEN NEW.is_issue_report THEN 'Issue reported on your project' ELSE 'New feedback on your project' END,
      'Feedback received on "' || COALESCE(v_report_title, 'Untitled') || '"',
      '/project-management?project=' || NEW.report_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feedback
  AFTER INSERT ON public.citizen_project_feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_feedback();

-- 3. Notification trigger for verification status changes
CREATE OR REPLACE FUNCTION public.notify_on_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_report_owner UUID;
  v_report_title TEXT;
BEGIN
  SELECT user_id, title INTO v_report_owner, v_report_title
  FROM public.reports WHERE id = NEW.report_id;
  
  IF v_report_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      v_report_owner,
      'success',
      'Verification update: ' || COALESCE(NEW.verification_level, 'review'),
      'Verification status updated on "' || COALESCE(v_report_title, 'Untitled') || '" — ' || COALESCE(NEW.status, 'pending'),
      '/project-management?project=' || NEW.report_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_verification
  AFTER INSERT OR UPDATE ON public.project_verifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_verification();

-- 4. Notification trigger for campaign donations
CREATE OR REPLACE FUNCTION public.notify_on_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_campaign_owner UUID;
  v_campaign_title TEXT;
BEGIN
  IF NEW.status = 'completed' THEN
    SELECT created_by, title INTO v_campaign_owner, v_campaign_title
    FROM public.fundraising_campaigns WHERE id = NEW.campaign_id;
    
    IF v_campaign_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        v_campaign_owner,
        'success',
        'New donation received!',
        '$' || NEW.amount || ' donated to "' || COALESCE(v_campaign_title, 'your campaign') || '"',
        '/fundraising'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_donation
  AFTER INSERT OR UPDATE ON public.campaign_donations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_donation();

-- 5. Add report_id to fundraising_campaigns for campaign-to-project linking
ALTER TABLE public.fundraising_campaigns 
  ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES public.reports(id);

-- 6. Index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications (user_id, is_read) WHERE is_read = false;
