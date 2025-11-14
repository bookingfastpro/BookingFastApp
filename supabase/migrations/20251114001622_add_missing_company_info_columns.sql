/*
  # Add missing columns to company_info table

  1. Changes
    - Add `legal_form` column to store legal entity type (SARL, SAS, etc.)
    - Add `pdf_primary_color` column for PDF customization
    - Add `pdf_accent_color` column for PDF customization
    - Add `pdf_text_color` column for PDF customization
*/

-- Add legal_form column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_info' AND column_name = 'legal_form'
  ) THEN
    ALTER TABLE company_info ADD COLUMN legal_form text;
  END IF;
END $$;

-- Add PDF color customization columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_info' AND column_name = 'pdf_primary_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_primary_color text DEFAULT '#2563eb';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_info' AND column_name = 'pdf_accent_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_accent_color text DEFAULT '#1e40af';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_info' AND column_name = 'pdf_text_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_text_color text DEFAULT '#1f2937';
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
