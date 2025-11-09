/*
  # Ajout de la colonne brevo_enabled

  1. Modifications
    - Ajout de brevo_enabled à business_settings pour activer/désactiver l'intégration Brevo
*/

-- Ajouter brevo_enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_enabled boolean DEFAULT false;
  END IF;
END $$;