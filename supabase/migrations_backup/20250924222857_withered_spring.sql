/*
  # Supprimer toutes les politiques RLS et les recréer sans récursion

  1. Suppression complète des politiques existantes
  2. Recréation avec des politiques ultra-simples
  3. Aucune jointure ou sous-requête complexe
  4. Isolation parfaite des données par utilisateur
*/

-- Désactiver RLS temporairement pour nettoyer
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON accounts;
DROP POLICY IF EXISTS "Account owners can manage their accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view their account memberships" ON account_users;
DROP POLICY IF EXISTS "Users can insert themselves into accounts" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage their team" ON account_users;
DROP POLICY IF EXISTS "Users can manage their own account memberships" ON account_users;

-- Réactiver RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- POLITIQUES ULTRA-SIMPLES POUR ACCOUNTS
-- Les utilisateurs ne voient que les comptes qu'ils possèdent
CREATE POLICY "accounts_select_own" ON accounts
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Les utilisateurs peuvent créer leurs propres comptes
CREATE POLICY "accounts_insert_own" ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Les utilisateurs peuvent modifier leurs propres comptes
CREATE POLICY "accounts_update_own" ON accounts
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- POLITIQUES ULTRA-SIMPLES POUR ACCOUNT_USERS
-- Les utilisateurs ne voient que leurs propres appartenances
CREATE POLICY "account_users_select_own" ON account_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent s'ajouter eux-mêmes
CREATE POLICY "account_users_insert_own" ON account_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent modifier leurs propres appartenances
CREATE POLICY "account_users_update_own" ON account_users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres appartenances
CREATE POLICY "account_users_delete_own" ON account_users
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
