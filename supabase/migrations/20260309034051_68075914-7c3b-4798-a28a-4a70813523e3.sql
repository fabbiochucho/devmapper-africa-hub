
-- Trigger: when admin_broadcasts inserted, create notification for each target user
CREATE OR REPLACE FUNCTION public.notify_on_broadcast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user RECORD;
BEGIN
  IF NEW.recipient_type = 'all' THEN
    -- Notify all users
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT p.user_id, 'info', NEW.subject, NEW.message, NULL
    FROM public.profiles p;
  ELSIF NEW.recipient_type LIKE 'role:%' THEN
    -- Notify users with specific role
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT ur.user_id, 'info', NEW.subject, NEW.message, NULL
    FROM public.user_roles ur
    WHERE ur.role::text = SUBSTRING(NEW.recipient_type FROM 6)
      AND ur.is_active = true;
  ELSIF NEW.recipient_ids IS NOT NULL AND array_length(NEW.recipient_ids, 1) > 0 THEN
    -- Notify specific users
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT unnest(NEW.recipient_ids), 'info', NEW.subject, NEW.message, NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_notify ON public.admin_broadcasts;
CREATE TRIGGER trg_broadcast_notify
  AFTER INSERT ON public.admin_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_broadcast();
