/*
  # Ajout de la table des indisponibilités

  1. Nouvelle table
    - `unavailabilities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `reason` (text, optionnel)
      - `assigned_user_id` (uuid, optionnel - pour multi-user)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Policies pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  assigned_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_unavailabilities_user_id ON unavailabilities(user_id);
CREATE INDEX idx_unavailabilities_date ON unavailabilities(date);
CREATE INDEX idx_unavailabilities_assigned_user ON unavailabilities(assigned_user_id);

ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unavailabilities"
  ON unavailabilities FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE owner_id = unavailabilities.user_id
    )
  );

CREATE POLICY "Users can create unavailabilities"
  ON unavailabilities FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    user_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their unavailabilities"
  ON unavailabilities FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    user_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their unavailabilities"
  ON unavailabilities FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT owner_id FROM team_members WHERE user_id = auth.uid()
    )
  );
