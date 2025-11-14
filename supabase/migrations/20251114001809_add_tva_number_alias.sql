/*
  # Add tva_number column as alias for vat_number

  1. Changes
    - Add `tva_number` column that mirrors `vat_number` for French compatibility
    - Keep both columns in sync for backward compatibility
*/

-- Add tva_number column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_info' AND column_name = 'tva_number'
  ) THEN
    ALTER TABLE company_info ADD COLUMN tva_number text;
    
    -- Copy existing data from vat_number to tva_number
    UPDATE company_info SET tva_number = vat_number WHERE vat_number IS NOT NULL;
  END IF;
END $$;

-- Create trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_vat_tva_numbers()
RETURNS TRIGGER AS $$
BEGIN
  -- If tva_number is updated, also update vat_number
  IF NEW.tva_number IS DISTINCT FROM OLD.tva_number THEN
    NEW.vat_number := NEW.tva_number;
  END IF;
  
  -- If vat_number is updated, also update tva_number
  IF NEW.vat_number IS DISTINCT FROM OLD.vat_number THEN
    NEW.tva_number := NEW.vat_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_vat_tva_trigger ON company_info;
CREATE TRIGGER sync_vat_tva_trigger
  BEFORE INSERT OR UPDATE ON company_info
  FOR EACH ROW
  EXECUTE FUNCTION sync_vat_tva_numbers();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
