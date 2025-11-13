/*
  # Fix Invoices and Invoice Items - Complete Schema
  
  ## Problems Identified
  
  ### Invoices Table
  - Code uses: invoice_date, subtotal_ht, total_tva, total_ttc, quote_number, payment_conditions, sent_at, paid_at, converted_at
  - Database has: issue_date, subtotal, tax_amount, total_amount
  - Missing: invoice_date, subtotal_ht, total_tva, total_ttc, quote_number, payment_conditions, sent_at, paid_at, converted_at
  
  ### Invoice Items Table
  - Code uses: tva_rate, total_tva, discount_percent
  - Database has: tax_rate, total_ht, total_ttc
  - Missing: tva_rate (alias), total_tva, discount_percent
  
  ## Changes Made
  
  1. Add missing columns to invoices table
  2. Add missing columns to invoice_items table
  3. Create views or sync data between old/new column names for compatibility
  
  ## Security
  - All existing RLS policies remain in place
*/

-- =====================================================
-- INVOICES TABLE - ADD MISSING COLUMNS
-- =====================================================

-- Add all missing columns
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS invoice_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS subtotal_ht numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tva numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ttc numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_number text,
  ADD COLUMN IF NOT EXISTS payment_conditions text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

-- Sync data from old columns to new ones
UPDATE invoices
SET 
  invoice_date = COALESCE(invoice_date, issue_date),
  subtotal_ht = COALESCE(subtotal_ht, subtotal),
  total_tva = COALESCE(total_tva, tax_amount),
  total_ttc = COALESCE(total_ttc, total_amount)
WHERE invoice_date IS NULL OR subtotal_ht = 0 OR total_tva = 0 OR total_ttc = 0;

-- Keep both sets of columns synced going forward with triggers
CREATE OR REPLACE FUNCTION sync_invoice_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync new columns to old columns
  NEW.issue_date := COALESCE(NEW.invoice_date, NEW.issue_date);
  NEW.subtotal := COALESCE(NEW.subtotal_ht, NEW.subtotal);
  NEW.tax_amount := COALESCE(NEW.total_tva, NEW.tax_amount);
  NEW.total_amount := COALESCE(NEW.total_ttc, NEW.total_amount);
  
  -- Sync old columns to new columns
  NEW.invoice_date := COALESCE(NEW.issue_date, NEW.invoice_date);
  NEW.subtotal_ht := COALESCE(NEW.subtotal, NEW.subtotal_ht);
  NEW.total_tva := COALESCE(NEW.tax_amount, NEW.total_tva);
  NEW.total_ttc := COALESCE(NEW.total_amount, NEW.total_ttc);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_invoice_columns_trigger ON invoices;
CREATE TRIGGER sync_invoice_columns_trigger
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_columns();

-- =====================================================
-- INVOICE ITEMS TABLE - ADD MISSING COLUMNS
-- =====================================================

-- Add missing columns
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS tva_rate numeric DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS total_tva numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;

-- Sync data
UPDATE invoice_items
SET 
  tva_rate = COALESCE(tva_rate, tax_rate),
  total_tva = COALESCE(total_tva, total_ttc - total_ht)
WHERE tva_rate IS NULL OR tva_rate = 0 OR total_tva = 0;

-- Keep columns synced with trigger
CREATE OR REPLACE FUNCTION sync_invoice_item_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync tva_rate and tax_rate
  NEW.tva_rate := COALESCE(NEW.tva_rate, NEW.tax_rate);
  NEW.tax_rate := COALESCE(NEW.tax_rate, NEW.tva_rate);
  
  -- Calculate total_tva if not provided
  IF NEW.total_tva IS NULL OR NEW.total_tva = 0 THEN
    NEW.total_tva := NEW.total_ht * (COALESCE(NEW.tva_rate, 20) / 100);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_invoice_item_columns_trigger ON invoice_items;
CREATE TRIGGER sync_invoice_item_columns_trigger
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_item_columns();

-- =====================================================
-- NOTIFY POSTGREST
-- =====================================================

NOTIFY pgrst, 'reload schema';
