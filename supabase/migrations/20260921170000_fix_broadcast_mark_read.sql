-- Found during this session's Forum/Messages audit: NotificationCenter's
-- "mark all read" does `.update({ is_read_by: [session.user.id] })` on
-- admin_broadcasts, which (a) is silently rejected by RLS for every
-- non-admin caller today - "Admins can update broadcasts" is the ONLY
-- UPDATE policy on this table, so a regular user's PATCH matches zero
-- rows and the frontend shows a false "marked as read" success toast -
-- and (b) even if it were permitted, OVERWRITES the shared is_read_by
-- array instead of appending, which would wipe out every other
-- recipient's already-recorded read receipt on the same broadcast.
--
-- Fixed with a narrow SECURITY DEFINER function instead of a broader
-- UPDATE policy: it only ever appends the caller's own id, and only for
-- a broadcast the caller is an intended recipient of (same visibility
-- logic as "Users can view broadcasts targeted to them"), so it can't be
-- used to touch any other column or any other recipient's entry.
-- is_read_by is jsonb (not a native uuid[]), so this uses jsonb containment
-- (@>) and concatenation (||) rather than the array ANY()/array_append()
-- operators, which don't apply to jsonb.
CREATE OR REPLACE FUNCTION public.mark_broadcast_read(p_broadcast_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.admin_broadcasts
  SET is_read_by = is_read_by || jsonb_build_array(auth.uid())
  WHERE id = p_broadcast_id
    AND NOT (is_read_by @> jsonb_build_array(auth.uid()))
    AND (
      recipient_type = 'all'
      OR auth.uid() = ANY(recipient_ids)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'platform_admin'::app_role)
      OR (
        recipient_type LIKE 'role:%'
        AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role::text = substring(recipient_type from 6)
            AND user_roles.is_active = true
        )
      )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_broadcast_read(uuid) TO authenticated;
