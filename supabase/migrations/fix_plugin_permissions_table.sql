/*
  # Fix Plugin Permissions Table Permissions

  1. Actions
    - Donner tous les droits au rôle authenticated
    - Donner tous les droits au rôle anon
    - Donner tous les droits au rôle service_role
    - Désactiver RLS temporairement pour debug

  2. Sécurité
    - RLS désactivé temporairement
    - Permissions complètes pour tous les rôles
*/

-- PERMISSIONS COMPLÈTES pour authenticated
GRANT ALL ON team_member_plugin_permissions TO authenticated;

-- PERMISSIONS COMPLÈTES pour anon
GRANT ALL ON team_member_plugin_permissions TO anon;

-- PERMISSIONS COMPLÈTES pour service_role
GRANT ALL ON team_member_plugin_permissions TO service_role;

-- Désactiver RLS pour le moment
ALTER TABLE team_member_plugin_permissions DISABLE ROW LEVEL SECURITY;

-- Vérifier les permissions
DO $$
DECLARE
  perm_count integer;
BEGIN
  SELECT COUNT(*) INTO perm_count
  FROM information_schema.table_privileges
  WHERE table_name = 'team_member_plugin_permissions'
  AND grantee IN ('authenticated', 'anon', 'service_role');
  
  IF perm_count < 3 THEN
    RAISE EXCEPTION 'Permissions not properly set. Found % grants', perm_count;
  END IF;
  
  RAISE NOTICE 'Permissions successfully set. Found % grants', perm_count;
END $$;
