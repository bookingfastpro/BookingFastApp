/*
  # Correction de la récursion infinie dans les politiques RLS

  1. Problème identifié
    - Les politiques RLS sur la table `users` créent une récursion infinie
    - Les politiques font référence à la table `users` dans leurs conditions

  2. Solution
    - Supprimer toutes les politiques problématiques
    - Recréer des politiques simples sans récursion
    - Utiliser uniquement `auth.uid()` pour éviter les boucles
*/

-- Supprimer toutes les politiques existantes sur la table users
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Service role can read users" ON public.users;
DROP POLICY IF EXISTS "Super admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Recréer des politiques simples sans récursion
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Politique pour permettre l'insertion lors de l'inscription
CREATE POLICY "Allow user creation during signup"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Recréer la fonction is_super_admin sans récursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;
