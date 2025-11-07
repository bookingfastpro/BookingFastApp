/*
  # Create app_versions table from scratch

  1. New Tables
    - `app_versions`
      - `id` (uuid, primary key)
      - `version` (text, version number like "1.2.3")
      - `build` (text, build identifier like "2025.01.28")
      - `release_notes` (text, optional release notes)
      - `is_current` (boolean, marks current version)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_versions` table
    - Add policy for public read access to current version
    - Add policy for super admin full access
    - Add function to set current version

  3. Data
    - Insert default version 1.2.3
    - Set as current version
*/

-- Drop table if exists (clean slate)
DROP TABLE IF EXISTS app_versions CASCADE;

-- Create the app_versions table
CREATE TABLE app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '1.2.3',
  build text NOT NULL DEFAULT '2025.01.28',
  release_notes text DEFAULT '',
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view current app version"
  ON app_versions
  FOR SELECT
  TO public
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

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_app_versions_updated_at
  BEFORE UPDATE ON app_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_app_versions_updated_at();

-- Create function to set current version
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void AS $$
BEGIN
  -- Remove current flag from all versions
  UPDATE app_versions SET is_current = false;
  
  -- Set the specified version as current
  UPDATE app_versions 
  SET is_current = true, updated_at = now()
  WHERE id = version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default version
INSERT INTO app_versions (version, build, release_notes, is_current)
VALUES ('1.2.3', '2025.01.28', 'Version initiale de BookingFast', true)
ON CONFLICT DO NOTHING;

-- Verify the setup
DO $$
DECLARE
  version_count integer;
  current_version_count integer;
BEGIN
  SELECT COUNT(*) INTO version_count FROM app_versions;
  SELECT COUNT(*) INTO current_version_count FROM app_versions WHERE is_current = true;
  
  RAISE NOTICE 'app_versions table created successfully!';
  RAISE NOTICE 'Total versions: %', version_count;
  RAISE NOTICE 'Current versions: %', current_version_count;
  
  IF current_version_count = 0 THEN
    RAISE EXCEPTION 'No current version found after setup!';
  END IF;
END $$;
