/*
  # Fix Products Table - Add tva_rate Column
  
  ## Problem
  - Code uses: tva_rate
  - Database has: tax_rate
  
  ## Solution
  - Add tva_rate column
  - Create trigger to keep tva_rate and tax_rate synchronized
  
  ## Changes
  1. Add tva_rate column to products table
  2. Sync existing data
  3. Create trigger to auto-sync both columns
*/

-- Add tva_rate column
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS tva_rate numeric DEFAULT 20.00;

-- Sync existing data
UPDATE products
SET tva_rate = COALESCE(tva_rate, tax_rate)
WHERE tva_rate IS NULL OR tva_rate = 0;

-- Create trigger to keep columns synced
CREATE OR REPLACE FUNCTION sync_product_tax_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync tva_rate and tax_rate
  NEW.tva_rate := COALESCE(NEW.tva_rate, NEW.tax_rate);
  NEW.tax_rate := COALESCE(NEW.tax_rate, NEW.tva_rate);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_product_tax_rate_trigger ON products;
CREATE TRIGGER sync_product_tax_rate_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_tax_rate();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
