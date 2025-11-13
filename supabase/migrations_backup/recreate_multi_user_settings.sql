/*
  # Recréer la table multi_user_settings avec permissions correctes

  1. Actions
    - Supprimer et recréer la table
    - Activer RLS
    - Créer des policies complètes
    - Vérifier les permissions

  2. Sécurité
    - RLS activé
    - Policies pour toutes les opérations
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

-- Activer RLS
ALTER TABLE multi_user_settings ENABLE ROW LEVEL SECURITY;

-- Policies complètes
CREATE POLICY "multi_user_settings_select_policy"
  ON multi_user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "multi_user_settings_insert_policy"
  ON multi_user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "multi_user_settings_update_policy"
  ON multi_user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "multi_user_settings_delete_policy"
  ON multi_user_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Vérifier que RLS est bien activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'multi_user_settings' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on multi_user_settings';
  END IF;
END $$;
