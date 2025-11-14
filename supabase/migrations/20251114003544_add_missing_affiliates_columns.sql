/*
  # Add missing columns to affiliates table

  1. Changes
    - Add `is_active` column (boolean)
    - Add `pending_earnings` column (numeric)
    - Add alias for status -> is_active sync
*/

-- Add is_active column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliates' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN is_active boolean DEFAULT true;
    
    -- Sync from status if exists
    UPDATE affiliates SET is_active = (status = 'active') WHERE status IS NOT NULL;
  END IF;
END $$;

-- Add pending_earnings column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliates' AND column_name = 'pending_earnings'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN pending_earnings numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create trigger to keep status and is_active in sync
CREATE OR REPLACE FUNCTION sync_affiliate_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_active is updated, also update status
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    NEW.status := CASE WHEN NEW.is_active THEN 'active' ELSE 'inactive' END;
  END IF;
  
  -- If status is updated, also update is_active
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.is_active := (NEW.status = 'active');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_affiliate_status_trigger ON affiliates;
CREATE TRIGGER sync_affiliate_status_trigger
  BEFORE INSERT OR UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION sync_affiliate_status();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
