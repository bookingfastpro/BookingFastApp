/*
  # Add missing columns to pos_transactions table

  1. Changes
    - Add customer_phone column for customer contact information
    - Add subtotal column for amount before tax
    - Add tax_rate column for applied tax percentage
    - Add tax_amount column for calculated tax amount
    - Add total column for final amount (replaces total_ttc)
    - Rename/map existing columns for consistency

  2. Security
    - Maintains existing RLS policies
*/

-- Add customer_phone if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transactions' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE pos_transactions ADD COLUMN customer_phone text;
    COMMENT ON COLUMN pos_transactions.customer_phone IS 'Customer phone number for contact';
  END IF;
END $$;

-- Add subtotal if not exists (map from total_ht)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transactions' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE pos_transactions ADD COLUMN subtotal numeric(10,2) DEFAULT 0;
    -- Copy data from total_ht if it exists
    UPDATE pos_transactions SET subtotal = total_ht WHERE total_ht IS NOT NULL;
    COMMENT ON COLUMN pos_transactions.subtotal IS 'Subtotal amount before tax (HT)';
  END IF;
END $$;

-- Add tax_rate if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transactions' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE pos_transactions ADD COLUMN tax_rate numeric(5,2) DEFAULT 0;
    COMMENT ON COLUMN pos_transactions.tax_rate IS 'Tax rate percentage applied to transaction';
  END IF;
END $$;

-- Add tax_amount if not exists (map from total_tax)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transactions' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE pos_transactions ADD COLUMN tax_amount numeric(10,2) DEFAULT 0;
    -- Copy data from total_tax if it exists
    UPDATE pos_transactions SET tax_amount = total_tax WHERE total_tax IS NOT NULL;
    COMMENT ON COLUMN pos_transactions.tax_amount IS 'Calculated tax amount';
  END IF;
END $$;

-- Add total if not exists (map from total_ttc)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_transactions' AND column_name = 'total'
  ) THEN
    ALTER TABLE pos_transactions ADD COLUMN total numeric(10,2) DEFAULT 0;
    -- Copy data from total_ttc if it exists
    UPDATE pos_transactions SET total = total_ttc WHERE total_ttc IS NOT NULL;
    COMMENT ON COLUMN pos_transactions.total IS 'Total amount including tax (TTC)';
  END IF;
END $$;
