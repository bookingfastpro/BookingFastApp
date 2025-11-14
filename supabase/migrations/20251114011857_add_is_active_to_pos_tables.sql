/*
  # Add is_active column to POS tables

  1. Changes
    - Add is_active column to pos_categories table
    - Add is_active column to pos_products table
    - Set default value to true for new records
    - Update existing records to active

  2. Security
    - Maintains existing RLS policies
*/

-- Add is_active to pos_categories if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE pos_categories ADD COLUMN is_active boolean DEFAULT true;
    
    -- Update existing records to be active
    UPDATE pos_categories SET is_active = true WHERE is_active IS NULL;
    
    COMMENT ON COLUMN pos_categories.is_active IS 'Whether the category is active and visible in the POS system';
  END IF;
END $$;

-- Add is_active to pos_products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE pos_products ADD COLUMN is_active boolean DEFAULT true;
    
    -- Update existing records to be active
    UPDATE pos_products SET is_active = true WHERE is_active IS NULL;
    
    COMMENT ON COLUMN pos_products.is_active IS 'Whether the product is active and available for sale';
  END IF;
END $$;

-- Add icon column to pos_categories if not exists (for UI display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE pos_categories ADD COLUMN icon text;
    
    COMMENT ON COLUMN pos_categories.icon IS 'Icon name for category display (lucide-react icon name)';
  END IF;
END $$;
