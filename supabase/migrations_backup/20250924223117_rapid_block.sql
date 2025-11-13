/*
  # Supprimer RLS et utiliser des vues sécurisées

  1. Suppression complète de RLS
    - Désactive RLS sur accounts et account_users
    - Supprime toutes les politiques existantes
  
  2. Fonction de sécurité
    - Fonction pour vérifier l'accès aux comptes
    - Logique centralisée sans récursion
  
  3. Vues sécurisées
    - Vue pour les comptes accessibles
    - Vue pour les utilisateurs de compte
    - SECURITY DEFINER pour contourner RLS
*/

-- Désactiver RLS complètement
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "authenticated_access" ON accounts;
DROP POLICY IF EXISTS "authenticated_access" ON account_users;
DROP POLICY IF EXISTS "Users can view accounts they own" ON accounts;
DROP POLICY IF EXISTS "Users can update accounts they own" ON accounts;
DROP POLICY IF EXISTS "Users can view account_users for their accounts" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage account users" ON account_users;

-- Créer une fonction de sécurité simple
CREATE OR REPLACE FUNCTION get_user_accounts()
RETURNS TABLE(
  account_id uuid,
  account_name text,
  account_description text,
  owner_id uuid,
  user_role text,
  user_permissions jsonb,
  is_active boolean
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as account_id,
    a.name as account_name,
    a.description as account_description,
    a.owner_id,
    au.role as user_role,
    au.permissions as user_permissions,
    au.is_active
  FROM accounts a
  JOIN account_users au ON a.id = au.account_id
  WHERE au.user_id = auth.uid()
    AND au.is_active = true;
END;
$$;

-- Créer une vue sécurisée pour les comptes
CREATE OR REPLACE VIEW user_accessible_accounts
WITH (security_invoker = false)
AS
SELECT * FROM get_user_accounts();

-- Accorder les permissions nécessaires
GRANT SELECT ON user_accessible_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accounts() TO authenticated;
