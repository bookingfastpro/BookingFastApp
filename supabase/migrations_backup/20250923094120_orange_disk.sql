/*
  # Fix roles table RLS policies

  1. Problem
    - Current RLS policies use is_super_admin() function which conflicts with column name
    - This causes "function is_super_admin() is not unique" errors

  2. Solution
    - Remove dependency on is_super_admin() function in RLS policies
    - Use direct column access instead
    - Simplify policies to avoid function conflicts

  3. Changes
    - Update roles table policies to use users.is_super_admin column directly
    - Remove function calls that cause conflicts
*/

-- Drop existing policies that use the conflicting function
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Users can read roles" ON public.roles;

-- Create new policies without function conflicts
CREATE POLICY "Super admins can manage roles"
  ON public.roles
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

CREATE POLICY "All authenticated users can read roles"
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);
