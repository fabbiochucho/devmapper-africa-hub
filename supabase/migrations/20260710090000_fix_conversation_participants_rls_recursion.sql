-- Fix: infinite recursion in conversation_participants RLS, cascading to
-- conversations and direct_messages.
--
-- Confirmed live: `GET /rest/v1/conversation_participants` (and
-- `conversations`, `direct_messages`) returns Postgres error 42P17
-- "infinite recursion detected in policy for relation
-- conversation_participants".
--
-- Root cause: conversation_participants."Users can view participants of
-- their conversations" (20260309013705) filters using a subquery against
-- conversation_participants itself:
--
--   conversation_id IN (
--     SELECT conversation_id FROM public.conversation_participants cp2
--     WHERE cp2.user_id = auth.uid()
--   )
--
-- That subquery is itself subject to the same RLS policy, so evaluating
-- the policy for any row requires re-evaluating the policy to filter the
-- subquery's rows, forever. conversations and direct_messages both filter
-- via a plain subquery into conversation_participants, so they inherit the
-- recursion transitively even though neither references itself directly.
--
-- Fix: same approach as the organizations/organization_members recursion
-- fix (20260709120000) - route the self-referential check through a
-- SECURITY DEFINER helper function, whose internal query bypasses RLS on
-- the table it reads and so cannot recurse into the calling policy.

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    public.is_conversation_participant((select auth.uid()), conversation_id)
    OR has_role((select auth.uid()), 'admin'::app_role)
    OR has_role((select auth.uid()), 'platform_admin'::app_role)
  );
