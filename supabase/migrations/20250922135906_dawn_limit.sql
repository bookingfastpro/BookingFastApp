/*
  # Ajouter les paramètres email Brevo

  1. Nouvelles colonnes
    - `brevo_enabled` (boolean) - Active/désactive l'envoi via Brevo
    - `brevo_api_key` (text) - Clé API Brevo pour l'authentification
    - `brevo_sender_email` (text) - Email expéditeur vérifié dans Brevo
    - `brevo_sender_name` (text) - Nom de l'expéditeur affiché

  2. Valeurs par défaut
    - brevo_enabled: false (désactivé par défaut)
    - brevo_sender_name: 'BookingPro' (nom par défaut)
*/

-- Ajouter les colonnes pour la configuration Brevo
DO $$
BEGIN
  -- Ajouter brevo_enabled si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_enabled boolean DEFAULT false;
  END IF;

  -- Ajouter brevo_api_key si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_api_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_api_key text;
  END IF;

  -- Ajouter brevo_sender_email si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_sender_email'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_sender_email text;
  END IF;

  -- Ajouter brevo_sender_name si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_sender_name'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_sender_name text DEFAULT 'BookingPro';
  END IF;
END $$;
