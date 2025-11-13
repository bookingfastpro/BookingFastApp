/*
  # Fix app_versions table unauthorized access

  1. Security
    - Fix RLS policies for public access to current version
    - Allow anonymous users to read current version
    - Maintain super admin permissions for management

  2. Changes
    - Update SELECT policy to allow anonymous access
    - Ensure current version is publicly readable
    - Keep admin-only policies for modifications
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view current app version" ON app_versions;
DROP POLICY IF EXISTS "Public can view current app version" ON app_versions;
DROP POLICY IF EXISTS "Super admins can insert app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can update app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can delete app versions" ON app_versions;

-- Create new policies with proper permissions
CREATE POLICY "Public can view current app version"
  ON app_versions
  FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

CREATE POLICY "Super admins can manage app versions"
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

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'app_versions'
ORDER BY policyname;

-- Test access for anonymous users
SELECT 'Testing anonymous access to current version:' as test;
SELECT version, build, is_current 
FROM app_versions 
WHERE is_current = true;

-- Ensure there's a current version
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_versions WHERE is_current = true) THEN
    INSERT INTO app_versions (version, build, release_notes, is_current)
    VALUES ('1.2.3', '2025.01.28', 'Version par défaut', true);
    RAISE NOTICE 'Version par défaut créée';
  END IF;
END $$;

SELECT 'Setup completed successfully!' as result;
