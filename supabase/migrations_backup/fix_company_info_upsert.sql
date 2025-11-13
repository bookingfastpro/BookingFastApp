/*
  # Fix Company Info UPSERT Policy

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy that works with UPSERT
    - Ensure UPDATE policy allows UPSERT operations
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own company info" ON company_info;

-- Create new INSERT policy that works with UPSERT
CREATE POLICY "Users can insert their own company info"
  ON company_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy exists and works correctly
DROP POLICY IF EXISTS "Users can update their own company info" ON company_info;

CREATE POLICY "Users can update their own company info"
  ON company_info
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
