/*
  # Fix Infinite Recursion in Profiles RLS Policy
  
  ## Problem
  - "Super admins can view all profiles" policy causes infinite recursion
  - It queries profiles table while checking profiles table permissions
  - Already have "Profiles are viewable by everyone" policy
  
  ## Solution
  - Drop the problematic recursive policy
  - Keep the simple "viewable by everyone" policy
*/

-- Supprimer la politique récursive problématique
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

NOTIFY pgrst, 'reload schema';
