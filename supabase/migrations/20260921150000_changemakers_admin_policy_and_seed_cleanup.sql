-- Found during this session's ChangeMaker audit: the public "verified
-- change-maker registry" (llms.txt, /change-makers) has been running
-- entirely on fabricated frontend mock data since launch, while the real
-- change_makers table sat mostly empty except for 3 placeholder rows
-- inserted by the original seed migration (user_id NULL, image_url
-- '/placeholder.svg', never nominated by anyone). Removing them so the
-- registry - now wired to the real table in the same pass - starts from
-- an honest empty state rather than mixing real nominees with demo rows.
--
-- Also: change_makers had no admin-manage policy at all (not even SELECT
-- restricted - literally no admin override existed for UPDATE/DELETE),
-- unlike every other user-content table in this schema. Adding one now,
-- both to allow this cleanup through the normal RLS-respecting path in
-- future and to give admins the same moderation capability they have
-- everywhere else (e.g. correcting or removing a profile that violates
-- guidelines).
CREATE POLICY "Admins can manage change makers"
ON public.change_makers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

DELETE FROM public.change_makers
WHERE id IN (
  'a4d1c172-7d72-41a7-bb45-e711b6a46c88', -- 'Education Advocate' seed row
  '6ca0b81d-f4e3-44cb-a67b-e6c0d2040664', -- 'Clean Water Champion' seed row
  'd20f53f5-1475-4945-9154-b71f8941e2a5'  -- 'Climate Action Leader' seed row
)
AND user_id IS NULL AND image_url = '/placeholder.svg';
