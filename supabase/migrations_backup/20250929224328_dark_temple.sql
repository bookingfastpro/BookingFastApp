/*
  # Create app_versions table

  1. New Tables
    - `app_versions`
      - `id` (uuid, primary key)
      - `version` (text, version number like "1.2.3")
      - `build` (text, build identifier like "2025.01.28")
      - `release_notes` (text, optional release notes)
      - `is_current` (boolean, marks the current active version)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_versions` table
    - Add policy for public to read current version
    - Add policies for super admins to manage versions

  3. Functions
    - Create `set_current_version()` function to manage current version
    - Create trigger for updated_at timestamp

  4. Initial Data
    - Insert default version 1.2.3 with build 2025.01.28
*/

-- Create the app_versions table
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  build text NOT NULL,
  release_notes text,
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

-- Create function to set current version
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
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Set all versions to not current
  UPDATE app_versions SET is_current = false;
  
  -- Set the specified version as current
  UPDATE app_versions 
  SET is_current = true, updated_at = now()
  WHERE id = version_id;
END;
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_app_versions_updated_at ON app_versions;
CREATE TRIGGER update_app_versions_updated_at
  BEFORE UPDATE ON app_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_app_versions_updated_at();

-- Insert default version if none exists
INSERT INTO app_versions (version, build, release_notes, is_current)
SELECT '1.2.3', '2025.01.28', 'Version initiale du système', true
WHERE NOT EXISTS (SELECT 1 FROM app_versions);

-- Verify the setup
SELECT 'Table app_versions created successfully!' as status;
SELECT * FROM app_versions ORDER BY created_at DESC;
