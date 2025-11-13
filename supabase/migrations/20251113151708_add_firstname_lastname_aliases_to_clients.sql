/*
  # Add firstname/lastname alias columns to clients table
  
  ## Problem
  The clients table uses first_name and last_name (with underscores)
  But the frontend code expects firstname and lastname (without underscores)
  
  ## Solution
  Add computed columns or views to provide both naming conventions
  Since PostgreSQL doesn't support true column aliases, we'll:
  1. Add actual columns firstname and lastname
  2. Create triggers to keep them in sync with first_name and last_name
  3. This ensures backward compatibility with both naming conventions
*/

-- ============================================================================
-- STEP 1: Add firstname and lastname columns
-- ============================================================================

-- Add firstname column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'firstname'
  ) THEN
    ALTER TABLE clients ADD COLUMN firstname text;
  END IF;
END $$;

-- Add lastname column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'lastname'
  ) THEN
    ALTER TABLE clients ADD COLUMN lastname text;
  END IF;
END $$;

-- Copy existing data to new columns
UPDATE clients
SET 
  firstname = first_name,
  lastname = last_name
WHERE firstname IS NULL OR lastname IS NULL;

-- ============================================================================
-- STEP 2: Create triggers to keep columns in sync
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_client_name_columns ON clients;
DROP FUNCTION IF EXISTS sync_client_name_columns();

-- Function to sync name columns on INSERT/UPDATE
CREATE OR REPLACE FUNCTION sync_client_name_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE, sync both naming conventions
  
  -- If firstname/lastname are provided, copy to first_name/last_name
  IF NEW.firstname IS NOT NULL AND NEW.firstname != '' THEN
    NEW.first_name := NEW.firstname;
  END IF;
  
  IF NEW.lastname IS NOT NULL AND NEW.lastname != '' THEN
    NEW.last_name := NEW.lastname;
  END IF;
  
  -- If first_name/last_name are provided, copy to firstname/lastname
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN
    NEW.firstname := NEW.first_name;
  END IF;
  
  IF NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN
    NEW.lastname := NEW.last_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert or update
CREATE TRIGGER sync_client_name_columns
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_name_columns();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_client_name_columns() TO authenticated;
