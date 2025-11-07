/*
  # Fix user_roles table RLS policies

  1. Problem
    - Current RLS policies use can_manage_users() function which may conflict
    - Need to simplify policies to avoid function conflicts

  2. Solution
    - Use direct column access instead of functions
    - Simplify policies for better performance

  3. Changes
    - Update user_roles table policies to use direct column access
    - Remove function dependencies that cause conflicts
*/

-- Drop existing policies that might use conflicting functions
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;

-- Create new simplified policies
CREATE POLICY "Super admins can manage user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Users can read their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );
