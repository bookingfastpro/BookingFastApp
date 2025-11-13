/*
  # Fix infinite recursion in account_users policies

  1. Policy Changes
    - Drop existing policies that cause recursion
    - Create simplified policies that avoid circular references
    - Use direct user ID comparisons instead of complex subqueries

  2. Security
    - Maintain proper access control
    - Avoid self-referencing queries in policies
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Enable delete for account owner" ON account_users;
DROP POLICY IF EXISTS "Enable insert for account owner" ON account_users;
DROP POLICY IF EXISTS "Enable read access for account members" ON account_users;
DROP POLICY IF EXISTS "Enable update for account owner" ON account_users;

-- Create simplified policies without recursion
CREATE POLICY "Account owners can manage all account users"
  ON account_users
  FOR ALL
  TO authenticated
  USING (auth.uid() = account_id)
  WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can read their own account membership"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
