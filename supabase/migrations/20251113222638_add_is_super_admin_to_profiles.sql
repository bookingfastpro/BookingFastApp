/*
  # Add is_super_admin column to profiles
  
  ## Problem
  - Code expects is_super_admin column in users/profiles table
  - Column doesn't exist
  
  ## Solution
  - Add is_super_admin boolean column to profiles table
  - Default to false for security
*/

-- Ajouter la colonne is_super_admin
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false NOT NULL;

-- Mettre à jour la politique RLS pour permettre aux super admins de tout voir
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
CREATE POLICY "Super admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = id) OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_super_admin = true
    )
  );

NOTIFY pgrst, 'reload schema';
