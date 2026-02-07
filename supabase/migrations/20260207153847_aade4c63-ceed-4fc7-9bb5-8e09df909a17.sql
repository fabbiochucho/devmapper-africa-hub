-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

-- Allow users to insert their own non-admin roles
CREATE POLICY "Users can insert their own non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role NOT IN ('admin', 'platform_admin', 'country_admin')
);

-- Allow admins to insert any role for any user
CREATE POLICY "Admins can insert any role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role)
);

-- Allow users to update (deactivate) their own roles
CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to update any user's roles
CREATE POLICY "Admins can update any role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- Allow users to delete their own non-admin roles
CREATE POLICY "Users can delete their own non-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND role NOT IN ('admin', 'platform_admin', 'country_admin')
);

-- Allow admins to delete any role
CREATE POLICY "Admins can delete any role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));