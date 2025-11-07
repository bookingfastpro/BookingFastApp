/*
  # Fix Access Codes RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add policy to allow authenticated users to read all access codes
    - Keep admin-only policies for insert/update/delete
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own access codes" ON access_codes;
DROP POLICY IF EXISTS "Super admins can manage access codes" ON access_codes;

-- Allow all authenticated users to read access codes (needed for redemption)
CREATE POLICY "Authenticated users can read access codes"
  ON access_codes FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can insert access codes
CREATE POLICY "Super admins can insert access codes"
  ON access_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Only super admins can update access codes
CREATE POLICY "Super admins can update access codes"
  ON access_codes FOR UPDATE
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

-- Only super admins can delete access codes
CREATE POLICY "Super admins can delete access codes"
  ON access_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );
