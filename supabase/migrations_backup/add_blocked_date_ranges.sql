/*
  # Ajout du système de blocage de plages de dates

  1. Nouvelle table
    - `blocked_date_ranges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `start_date` (date)
      - `end_date` (date)
      - `reason` (text, optionnel)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Policies pour les utilisateurs authentifiés et accès public pour iframe
*/

CREATE TABLE IF NOT EXISTS blocked_date_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_blocked_date_ranges_user_id ON blocked_date_ranges(user_id);
CREATE INDEX idx_blocked_date_ranges_dates ON blocked_date_ranges(start_date, end_date);

ALTER TABLE blocked_date_ranges ENABLE ROW LEVEL SECURITY;

-- Policy pour les propriétaires (lecture/écriture complète)
CREATE POLICY "Owners can manage their blocked date ranges"
  ON blocked_date_ranges FOR ALL
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

-- Policy pour l'accès public (lecture seule pour iframe)
CREATE POLICY "Public can view blocked date ranges"
  ON blocked_date_ranges FOR SELECT
  TO anon
  USING (true);

-- Fonction pour vérifier si une date est bloquée
CREATE OR REPLACE FUNCTION is_date_blocked(
  p_user_id uuid,
  p_date date
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM blocked_date_ranges
    WHERE user_id = p_user_id
    AND p_date >= start_date
    AND p_date <= end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir toutes les plages bloquées d'un utilisateur
CREATE OR REPLACE FUNCTION get_blocked_date_ranges(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  start_date date,
  end_date date,
  reason text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bdr.id,
    bdr.start_date,
    bdr.end_date,
    bdr.reason,
    bdr.created_at
  FROM blocked_date_ranges bdr
  WHERE bdr.user_id = p_user_id
  ORDER BY bdr.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
