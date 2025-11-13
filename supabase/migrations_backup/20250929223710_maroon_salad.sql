-- Fix RLS policies for app_versions table to allow super admin operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can insert app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can update app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can delete app versions" ON app_versions;

-- Create proper RLS policies for super admins
CREATE POLICY "Super admins can insert app versions"
  ON app_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can update app versions"
  ON app_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can delete app versions"
  ON app_versions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'app_versions';
