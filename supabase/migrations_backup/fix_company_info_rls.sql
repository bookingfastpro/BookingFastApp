/*
  # Fix Company Info RLS Policies

  1. Changes
    - Drop existing policies on company_info
    - Add proper INSERT policy for authenticated users
    - Add proper UPDATE policy for authenticated users
    - Add proper SELECT policy for authenticated users
    - Add proper DELETE policy for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own company info" ON company_info;

-- Enable RLS
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "Users can view their own company info"
  ON company_info
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT
CREATE POLICY "Users can insert their own company info"
  ON company_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE
CREATE POLICY "Users can update their own company info"
  ON company_info
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE
CREATE POLICY "Users can delete their own company info"
  ON company_info
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
