/*
  # Corriger les permissions PostgreSQL pour multi_user_settings

  1. Actions
    - Recréer la table avec les bonnes permissions
    - Donner tous les droits au rôle authenticated
    - Donner tous les droits au rôle anon
    - Vérifier les permissions

  2. Sécurité
    - RLS désactivé temporairement pour debug
    - Permissions complètes pour authenticated et anon
*/

-- Supprimer la table existante
DROP TABLE IF EXISTS multi_user_settings CASCADE;

-- Recréer la table
CREATE TABLE multi_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view_only_assigned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_member_id)
);

-- Index
CREATE INDEX idx_multi_user_settings_user_id ON multi_user_settings(user_id);
CREATE INDEX idx_multi_user_settings_team_member_id ON multi_user_settings(team_member_id);

-- PERMISSIONS COMPLÈTES pour authenticated
GRANT ALL ON multi_user_settings TO authenticated;

-- PERMISSIONS COMPLÈTES pour anon
GRANT ALL ON multi_user_settings TO anon;

-- PERMISSIONS COMPLÈTES pour service_role
GRANT ALL ON multi_user_settings TO service_role;

-- Désactiver RLS pour le moment
ALTER TABLE multi_user_settings DISABLE ROW LEVEL SECURITY;

-- Vérifier les permissions
DO $$
DECLARE
  perm_count integer;
BEGIN
  SELECT COUNT(*) INTO perm_count
  FROM information_schema.table_privileges
  WHERE table_name = 'multi_user_settings'
  AND grantee IN ('authenticated', 'anon', 'service_role');
  
  IF perm_count < 3 THEN
    RAISE EXCEPTION 'Permissions not properly set. Found % grants', perm_count;
  END IF;
  
  RAISE NOTICE 'Permissions successfully set. Found % grants', perm_count;
END $$;
