/*
  # Ajout colonnes personnalisation PDF

  1. Modifications
    - Ajouter colonnes pour couleurs PDF personnalisées
    - Ajouter colonne pour URL du logo
*/

DO $$
BEGIN
  -- Ajouter colonne pdf_primary_color si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'pdf_primary_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_primary_color text DEFAULT '#9333ea';
  END IF;

  -- Ajouter colonne pdf_accent_color si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'pdf_accent_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_accent_color text DEFAULT '#ec4899';
  END IF;

  -- Ajouter colonne pdf_text_color si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'pdf_text_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_text_color text DEFAULT '#1f2937';
  END IF;

  -- Vérifier si logo_url existe déjà (créé dans migration précédente)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'logo_url'
  ) THEN
    -- La colonne existe déjà, ne rien faire
    NULL;
  END IF;
END $$;
