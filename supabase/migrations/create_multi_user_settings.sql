/*
  # Paramètres du plugin Multi-User

  1. Nouvelle Table
    - `multi_user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Propriétaire
      - `team_member_id` (uuid, foreign key) - Membre d'équipe
      - `can_view_only_assigned` (boolean) - Voir uniquement ses réservations
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé
    - Policies pour propriétaires uniquement
*/

CREATE TABLE IF NOT EXISTS multi_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_view_only_assigned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_multi_user_settings_user_id ON multi_user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_user_settings_team_member_id ON multi_user_settings(team_member_id);

ALTER TABLE multi_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage multi-user settings"
  ON multi_user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
