/*
  # Fix Plugin Permissions Foreign Key

  1. Problème
    - La contrainte FK pointe vers `users` au lieu de `team_members`
    - Les IDs utilisés sont des IDs de membres d'équipe, pas d'utilisateurs auth

  2. Solution
    - Supprimer l'ancienne contrainte FK
    - Créer une nouvelle contrainte pointant vers `team_members`
    - Renommer la colonne pour plus de clarté

  3. Sécurité
    - Maintenir l'intégrité référentielle
    - Permissions déjà configurées
*/

-- Supprimer l'ancienne contrainte FK
ALTER TABLE team_member_plugin_permissions 
DROP CONSTRAINT IF EXISTS team_member_plugin_permissions_user_id_fkey;

-- Renommer la colonne pour plus de clarté
ALTER TABLE team_member_plugin_permissions 
RENAME COLUMN user_id TO team_member_id;

-- Créer la nouvelle contrainte FK pointant vers team_members
ALTER TABLE team_member_plugin_permissions
ADD CONSTRAINT team_member_plugin_permissions_team_member_id_fkey
FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE;

-- Mettre à jour la contrainte UNIQUE
ALTER TABLE team_member_plugin_permissions
DROP CONSTRAINT IF EXISTS team_member_plugin_permissions_user_id_owner_id_plugin_id_key;

ALTER TABLE team_member_plugin_permissions
ADD CONSTRAINT team_member_plugin_permissions_unique_key
UNIQUE(team_member_id, owner_id, plugin_id);

-- Recréer l'index
DROP INDEX IF EXISTS idx_team_plugin_permissions_user_id;
CREATE INDEX idx_team_plugin_permissions_team_member_id 
ON team_member_plugin_permissions(team_member_id);

-- Vérifier la contrainte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'team_member_plugin_permissions_team_member_id_fkey'
    AND table_name = 'team_member_plugin_permissions'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint not created';
  END IF;
  
  RAISE NOTICE 'Foreign key constraint successfully updated';
END $$;
