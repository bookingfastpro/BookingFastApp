/*
  # Add missing columns to pos_transaction_items table

  1. Changes
    - Add unit_price column (alias for unit_price_ttc)
    - Add total_price column (alias for total_ttc)
    - Add total column (for consistency)
    - These columns match the frontend expectations

  2. Security
    - Maintains existing RLS policies
*/

-- Add unit_price if not exists (map to unit_price_ttc)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transaction_items' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE pos_transaction_items ADD COLUMN unit_price numeric(10,2);
    -- Copy data from unit_price_ttc if it exists
    UPDATE pos_transaction_items SET unit_price = unit_price_ttc WHERE unit_price_ttc IS NOT NULL;
    COMMENT ON COLUMN pos_transaction_items.unit_price IS 'Unit price (TTC) - alias for unit_price_ttc';
  END IF;
END $$;

-- Add total_price if not exists (map to total_ttc)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transaction_items' AND column_name = 'total_price'
  ) THEN
    ALTER TABLE pos_transaction_items ADD COLUMN total_price numeric(10,2);
    -- Copy data from total_ttc if it exists
    UPDATE pos_transaction_items SET total_price = total_ttc WHERE total_ttc IS NOT NULL;
    COMMENT ON COLUMN pos_transaction_items.total_price IS 'Total price (TTC) - alias for total_ttc';
  END IF;
END $$;

-- Add total if not exists (for consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transaction_items' AND column_name = 'total'
  ) THEN
    ALTER TABLE pos_transaction_items ADD COLUMN total numeric(10,2);
    -- Copy data from total_ttc if it exists
    UPDATE pos_transaction_items SET total = total_ttc WHERE total_ttc IS NOT NULL;
    COMMENT ON COLUMN pos_transaction_items.total IS 'Total amount (TTC) - alias for total_ttc';
  END IF;
END $$;
