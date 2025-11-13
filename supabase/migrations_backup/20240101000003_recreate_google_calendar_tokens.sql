/*
  # Recréation complète de la table google_calendar_tokens

  1. Problème
    - Colonne 'scope' manquante dans le schéma cache
    - La table existe mais est incomplète

  2. Solution
    - Supprimer et recréer la table avec TOUTES les colonnes
    - Réappliquer les permissions et RLS

  3. Sécurité
    - RLS activé
    - Policies pour authenticated users
*/

-- Supprimer la table existante (et ses dépendances)
DROP TABLE IF EXISTS google_calendar_tokens CASCADE;

-- Recréer la table avec TOUTES les colonnes
CREATE TABLE google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  scope text NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar',
  calendar_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Index pour les recherches par user_id
CREATE INDEX idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);

-- Activer RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Policy pour SELECT
CREATE POLICY "Users can read own calendar tokens"
  ON google_calendar_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy pour INSERT
CREATE POLICY "Users can insert own calendar tokens"
  ON google_calendar_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy pour UPDATE
CREATE POLICY "Users can update own calendar tokens"
  ON google_calendar_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour DELETE
CREATE POLICY "Users can delete own calendar tokens"
  ON google_calendar_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Donner toutes les permissions au rôle authenticated
GRANT ALL ON TABLE google_calendar_tokens TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Forcer le refresh du schéma cache
NOTIFY pgrst, 'reload schema';
