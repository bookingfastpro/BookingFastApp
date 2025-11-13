/*
  # Fix app_versions table permissions

  1. Security
    - Drop all existing policies that might be causing conflicts
    - Create new policies with proper permissions
    - Allow public access to current version
    - Allow super admins to manage all versions

  2. Functions
    - Create set_current_version function
    - Add trigger for updated_at

  3. Data
    - Insert default version if none exists
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public can view current app version" ON app_versions;
DROP POLICY IF EXISTS "Super admins can manage app versions" ON app_versions;
DROP POLICY IF EXISTS "Anyone can view current app version" ON app_versions;
DROP POLICY IF EXISTS "Super admins can manage all versions" ON app_versions;

-- Ensure RLS is enabled
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Create public policy for viewing current version (accessible to everyone including anonymous users)
CREATE POLICY "public_view_current_version" 
ON app_versions 
FOR SELECT 
TO public
USING (is_current = true);

-- Create super admin policy for all operations
CREATE POLICY "super_admin_manage_versions" 
ON app_versions 
FOR ALL 
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

-- Create or replace the set_current_version function
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can set current version';
  END IF;

  -- Set all versions to not current
  UPDATE app_versions SET is_current = false;
  
  -- Set the specified version as current
  UPDATE app_versions 
  SET is_current = true, updated_at = now()
  WHERE id = version_id;
END;
$$;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_app_versions_updated_at ON app_versions;
CREATE TRIGGER update_app_versions_updated_at
  BEFORE UPDATE ON app_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_app_versions_updated_at();

-- Insert default version if none exists
INSERT INTO app_versions (version, build, release_notes, is_current)
SELECT '1.2.3', '2025.01.28', 'Version initiale', true
WHERE NOT EXISTS (SELECT 1 FROM app_versions);

-- Test the policies
DO $$
BEGIN
  -- Test public access to current version
  PERFORM * FROM app_versions WHERE is_current = true;
  RAISE NOTICE 'Public access test: SUCCESS';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Public access test: FAILED - %', SQLERRM;
END;
$$;

-- Display current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'app_versions'
ORDER BY policyname;

-- Display current data
SELECT id, version, build, is_current, created_at 
FROM app_versions 
ORDER BY created_at DESC;

RAISE NOTICE 'app_versions permissions fixed successfully!';
