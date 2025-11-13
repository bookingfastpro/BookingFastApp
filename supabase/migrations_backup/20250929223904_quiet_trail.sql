-- Fix RLS permissions for app_versions table
-- This will allow super admins to INSERT, UPDATE, and DELETE app versions

-- First, let's check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '1.2.3',
  build text NOT NULL DEFAULT '2025.01.28',
  release_notes text DEFAULT '',
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view current app version" ON app_versions;
DROP POLICY IF EXISTS "Super admins can insert app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can update app versions" ON app_versions;
DROP POLICY IF EXISTS "Super admins can delete app versions" ON app_versions;

-- Create new policies with proper permissions
CREATE POLICY "Anyone can view current app version" 
ON app_versions FOR SELECT 
TO anon, authenticated 
USING (is_current = true);

CREATE POLICY "Super admins can insert app versions" 
ON app_versions FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Super admins can update app versions" 
ON app_versions FOR UPDATE 
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
ON app_versions FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.is_super_admin = true
  )
);

-- Create or replace the function to set current version
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void AS $$
BEGIN
  -- First, set all versions to not current
  UPDATE app_versions SET is_current = false;
  
  -- Then set the specified version as current
  UPDATE app_versions SET is_current = true WHERE id = version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_app_versions_updated_at ON app_versions;
CREATE TRIGGER update_app_versions_updated_at
  BEFORE UPDATE ON app_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_app_versions_updated_at();

-- Insert default version if none exists
INSERT INTO app_versions (version, build, release_notes, is_current)
SELECT '1.2.3', '2025.01.28', 'Version initiale avec gestion dynamique des versions', true
WHERE NOT EXISTS (SELECT 1 FROM app_versions);

-- Verify the setup
SELECT 
  'Policies created successfully' as status,
  COUNT(*) as total_versions,
  COUNT(*) FILTER (WHERE is_current = true) as current_versions
FROM app_versions;
