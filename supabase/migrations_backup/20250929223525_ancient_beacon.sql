/*
  # Fix app_versions table permissions

  1. Security Updates
    - Add INSERT policy for super admins to create versions
    - Add UPDATE policy for super admins to modify versions  
    - Add DELETE policy for super admins to delete versions
    - Keep SELECT policy for public access to current version

  2. Function Updates
    - Ensure set_current_version function works properly
    - Add proper error handling
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view current app version" ON app_versions;
DROP POLICY IF EXISTS "Super admins can insert app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can update app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can delete app versions" ON app_versions;

-- Create comprehensive RLS policies for app_versions
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

-- Recreate the set_current_version function with proper security
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Set all versions to not current
  UPDATE app_versions SET is_current = false;
  
  -- Set the specified version as current
  UPDATE app_versions 
  SET is_current = true, updated_at = now()
  WHERE id = version_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found: %', version_id;
  END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION set_current_version(uuid) TO authenticated;

-- Insert a default version if none exists
INSERT INTO app_versions (version, build, release_notes, is_current)
SELECT '1.2.3', '2025.01.28', 'Version initiale', true
WHERE NOT EXISTS (SELECT 1 FROM app_versions WHERE is_current = true);

-- Verify the setup
SELECT 
  'app_versions table' as component,
  COUNT(*) as total_versions,
  COUNT(*) FILTER (WHERE is_current = true) as current_versions
FROM app_versions;
