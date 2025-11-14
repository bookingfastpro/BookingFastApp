/*
  # Add affiliate_code column as alias for code

  1. Changes
    - Add `affiliate_code` column that mirrors `code` for consistency
    - Keep both columns in sync via trigger
*/

-- Add affiliate_code column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliates' AND column_name = 'affiliate_code'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN affiliate_code text;
    
    -- Copy existing data from code to affiliate_code
    UPDATE affiliates SET affiliate_code = code WHERE code IS NOT NULL;
  END IF;
END $$;

-- Create trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_affiliate_code()
RETURNS TRIGGER AS $$
BEGIN
  -- If affiliate_code is updated, also update code
  IF NEW.affiliate_code IS DISTINCT FROM OLD.affiliate_code THEN
    NEW.code := NEW.affiliate_code;
  END IF;
  
  -- If code is updated, also update affiliate_code
  IF NEW.code IS DISTINCT FROM OLD.code THEN
    NEW.affiliate_code := NEW.code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_affiliate_code_trigger ON affiliates;
CREATE TRIGGER sync_affiliate_code_trigger
  BEFORE INSERT OR UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION sync_affiliate_code();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
