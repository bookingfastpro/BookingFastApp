/*
  # Ajout des paramètres Google Calendar

  1. Modifications
    - Ajout des colonnes pour Google Calendar dans business_settings
    - Ajout d'une table pour stocker les tokens OAuth
    - Ajout d'une colonne pour stocker l'ID de l'événement Google Calendar dans bookings

  2. Sécurité
    - RLS activé sur la table google_calendar_tokens
    - Policies pour accès utilisateur uniquement
*/

-- Ajout des colonnes Google Calendar dans business_settings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'google_calendar_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN google_calendar_enabled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'google_calendar_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN google_calendar_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'google_calendar_sync_status'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN google_calendar_sync_status TEXT DEFAULT 'disconnected';
  END IF;
END $$;

-- Création de la table pour les tokens OAuth Google
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Ajout de la colonne pour l'ID de l'événement Google Calendar dans bookings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'google_calendar_event_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN google_calendar_event_id TEXT;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bookings_google_calendar_event_id 
  ON bookings(google_calendar_event_id) 
  WHERE google_calendar_event_id IS NOT NULL;

-- RLS pour google_calendar_tokens
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Policy pour que les utilisateurs puissent gérer leurs propres tokens
CREATE POLICY "Users can manage their own Google Calendar tokens"
  ON google_calendar_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_google_calendar_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_google_calendar_tokens_updated_at ON google_calendar_tokens;
CREATE TRIGGER update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_calendar_tokens_updated_at();
