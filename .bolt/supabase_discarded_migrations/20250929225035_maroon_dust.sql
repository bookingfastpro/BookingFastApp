/*
  # Disable RLS on app_versions table

  1. Security Changes
    - Disable Row Level Security on app_versions table
    - Remove all existing policies
    - Allow direct access to the table

  2. Table Setup
    - Ensure table exists with proper structure
    - Add default version if none exists
    - Keep the set_current_version function
*/

-- Drop all existing policies first
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Public can view current app version" ON app_versions;
  DROP POLICY IF EXISTS "Super admins can manage app versions" ON app_versions;
  DROP POLICY IF EXISTS "Anyone can view current version" ON app_versions;
  DROP POLICY IF EXISTS "Super admins can insert versions" ON app_versions;
  DROP POLICY IF EXISTS "Super admins can update versions" ON app_versions;
  DROP POLICY IF EXISTS "Super admins can delete versions" ON app_versions;
  
  RAISE NOTICE 'All existing policies dropped';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies (may not exist): %', SQLERRM;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '1.2.3',
  build text NOT NULL DEFAULT '2025.01.28',
  release_notes text DEFAULT '',
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- DISABLE RLS completely
ALTER TABLE app_versions DISABLE ROW LEVEL SECURITY;

-- Create or replace the set_current_version function
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set all versions to not current
  UPDATE app_versions SET is_current = false, updated_at = now();
  
  -- Set the specified version as current
  UPDATE app_versions 
  SET is_current = true, updated_at = now()
  WHERE id = version_id;
END;
$$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  -- Drop trigger if exists
  DROP TRIGGER IF EXISTS update_app_versions_updated_at ON app_versions;
  
  -- Create the trigger function if it doesn't exist
  CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
  
  -- Create the trigger
  CREATE TRIGGER update_app_versions_updated_at
    BEFORE UPDATE ON app_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_app_versions_updated_at();
    
  RAISE NOTICE 'Trigger created successfully';
END $$;

-- Insert default version if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_versions LIMIT 1) THEN
    INSERT INTO app_versions (version, build, release_notes, is_current)
    VALUES ('1.2.3', '2025.01.28', 'Version initiale avec toutes les fonctionnalités', true);
    
    RAISE NOTICE 'Default version inserted';
  ELSE
    RAISE NOTICE 'Versions already exist';
  END IF;
END $$;

-- Test access (should work now)
DO $$
DECLARE
  version_count integer;
BEGIN
  SELECT COUNT(*) INTO version_count FROM app_versions;
  RAISE NOTICE 'app_versions table accessible - % versions found', version_count;
END $$;

RAISE NOTICE 'RLS disabled on app_versions - table is now publicly accessible';
