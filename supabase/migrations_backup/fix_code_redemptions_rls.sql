/*
  # Fix Code Redemptions RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add policy to allow authenticated users to insert their own redemptions
    - Add policy to allow users to read their own redemptions
    - Keep admin policies for management
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own redemptions" ON code_redemptions;
DROP POLICY IF EXISTS "Super admins can manage redemptions" ON code_redemptions;

-- Allow authenticated users to insert their own redemptions
CREATE POLICY "Users can insert own redemptions"
  ON code_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own redemptions
CREATE POLICY "Users can read own redemptions"
  ON code_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow super admins to read all redemptions
CREATE POLICY "Super admins can read all redemptions"
  ON code_redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Allow super admins to delete redemptions
CREATE POLICY "Super admins can delete redemptions"
  ON code_redemptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );
