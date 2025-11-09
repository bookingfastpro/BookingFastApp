/*
  # Ajout de la colonne brevo_api_key à business_settings

  1. Modifications
    - Ajout de brevo_api_key pour l'intégration avec Brevo (Sendinblue)
    - Ajout d'autres colonnes manquantes pour la configuration email
*/

-- Ajouter brevo_api_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_api_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_api_key text;
  END IF;
END $$;

-- Ajouter brevo_sender_email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_sender_email'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_sender_email text;
  END IF;
END $$;

-- Ajouter brevo_sender_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'brevo_sender_name'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN brevo_sender_name text;
  END IF;
END $$;

-- Ajouter enable_email_workflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'enable_email_workflows'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN enable_email_workflows boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter booking_confirmation_template_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'booking_confirmation_template_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN booking_confirmation_template_id text;
  END IF;
END $$;

-- Ajouter booking_reminder_template_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'booking_reminder_template_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN booking_reminder_template_id text;
  END IF;
END $$;

-- Ajouter iframe_team_id pour la sélection d'équipe dans l'iframe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'iframe_team_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN iframe_team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter enable_public_booking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'enable_public_booking'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN enable_public_booking boolean DEFAULT true;
  END IF;
END $$;

-- Ajouter require_phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'require_phone'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN require_phone boolean DEFAULT true;
  END IF;
END $$;

-- Ajouter custom_css
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'custom_css'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN custom_css text;
  END IF;
END $$;

-- Ajouter pdf_header_text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'pdf_header_text'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN pdf_header_text text;
  END IF;
END $$;

-- Ajouter pdf_footer_text
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'pdf_footer_text'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN pdf_footer_text text;
  END IF;
END $$;

-- Ajouter pdf_show_logo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'pdf_show_logo'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN pdf_show_logo boolean DEFAULT true;
  END IF;
END $$;

-- Ajouter pdf_primary_color
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'pdf_primary_color'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN pdf_primary_color text DEFAULT '#3B82F6';
  END IF;
END $$;