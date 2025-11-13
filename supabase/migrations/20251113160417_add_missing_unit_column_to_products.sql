/*
  # Add Missing 'unit' Column to Products Table
  
  ## Problem
  The TypeScript code expects a 'unit' column in the products table but it doesn't exist.
  
  ## Solution
  Add the 'unit' column with a default value.
  
  ## Changes
  - Add 'unit' column to products table (text type, default 'unité')
*/

-- Add unit column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'unit'
  ) THEN
    ALTER TABLE products ADD COLUMN unit text DEFAULT 'unité';
  END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
