/*
  # Fix affiliates RLS policies

  1. Changes
    - Add INSERT policy for users to create their own affiliate account
    - Add DELETE policy for users to delete their own affiliate account
    - Ensure all CRUD operations are covered
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Affiliates can view their own data" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update their own data" ON affiliates;
DROP POLICY IF EXISTS "Users can create their own affiliate account" ON affiliates;
DROP POLICY IF EXISTS "Users can delete their own affiliate account" ON affiliates;

-- SELECT: Users can view their own affiliate data
CREATE POLICY "Users can view their own affiliate data"
  ON affiliates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own affiliate account
CREATE POLICY "Users can create their own affiliate account"
  ON affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own affiliate data
CREATE POLICY "Users can update their own affiliate data"
  ON affiliates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own affiliate account
CREATE POLICY "Users can delete their own affiliate account"
  ON affiliates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
