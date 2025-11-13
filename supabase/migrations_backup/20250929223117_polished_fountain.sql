/*
  # Fix RLS permissions for app_versions table

  1. Security Updates
    - Add missing INSERT and UPDATE policies for super admins
    - Ensure only super admins can modify app versions
    - Keep SELECT policy for public access to current version
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage app versions" ON app_versions;
DROP POLICY IF EXISTS "Anyone can view current app version" ON app_versions;

-- Create comprehensive policies for app_versions table
CREATE POLICY "Anyone can view current app version"
  ON app_versions
  FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

CREATE POLICY "Super admins can insert app versions"
  ON app_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "Super admins can update app versions"
  ON app_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

CREATE POLICY "Super admins can delete app versions"
  ON app_versions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );
