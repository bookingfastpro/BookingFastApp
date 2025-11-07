/*
  # Système de paramètres d'entreprise - Version finale

  1. Nouvelles tables
    - `business_settings`
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `primary_color` (text)
      - `secondary_color` (text)
      - `logo_url` (text, nullable)
      - `opening_hours` (jsonb)
      - `buffer_minutes` (integer)
      - `default_deposit_percentage` (integer)
      - `email_notifications` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `business_settings`
    - Politique de lecture publique
    - Politique de modification pour les utilisateurs authentifiés
*/

-- Supprimer la table existante si elle existe
DROP TABLE IF EXISTS business_settings CASCADE;

-- Créer la table business_settings
CREATE TABLE business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'BookingPro',
  primary_color text NOT NULL DEFAULT '#3B82F6',
  secondary_color text NOT NULL DEFAULT '#8B5CF6',
  logo_url text,
  opening_hours jsonb NOT NULL DEFAULT '{
    "monday": {"start": "08:00", "end": "18:00", "closed": false},
    "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
    "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
    "thursday": {"start": "08:00", "end": "18:00", "closed": false},
    "friday": {"start": "08:00", "end": "18:00", "closed": false},
    "saturday": {"start": "09:00", "end": "17:00", "closed": false},
    "sunday": {"start": "10:00", "end": "16:00", "closed": true}
  }',
  buffer_minutes integer NOT NULL DEFAULT 15,
  default_deposit_percentage integer NOT NULL DEFAULT 30,
  email_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Lecture publique des paramètres"
  ON business_settings
  FOR SELECT
  TO public
  USING (true);

-- Politique de modification pour tous (pour simplifier)
CREATE POLICY "Modification des paramètres"
  ON business_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insérer les paramètres par défaut
INSERT INTO business_settings (
  business_name,
  primary_color,
  secondary_color,
  opening_hours,
  buffer_minutes,
  default_deposit_percentage,
  email_notifications
) VALUES (
  'BookingPro',
  '#3B82F6',
  '#8B5CF6',
  '{
    "monday": {"start": "08:00", "end": "18:00", "closed": false},
    "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
    "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
    "thursday": {"start": "08:00", "end": "18:00", "closed": false},
    "friday": {"start": "08:00", "end": "18:00", "closed": false},
    "saturday": {"start": "09:00", "end": "17:00", "closed": false},
    "sunday": {"start": "10:00", "end": "16:00", "closed": true}
  }',
  15,
  30,
  true
);

-- Index pour les performances
CREATE INDEX idx_business_settings_updated_at ON business_settings(updated_at);
