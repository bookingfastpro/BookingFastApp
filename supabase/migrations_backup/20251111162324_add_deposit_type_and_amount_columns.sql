/*
  # Add deposit type and amount columns

  This migration adds the missing deposit configuration columns to business_settings.

  ## Changes
  - Add `deposit_type` column (percentage or fixed)
  - Add `deposit_fixed_amount` column for fixed deposit amounts
  - Add `multiply_deposit_by_services` column (renamed from multiply_deposit_by_quantity)
  - Add `stripe_webhook_secret` column for Stripe webhooks
*/

-- Add deposit_type column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'deposit_type'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN deposit_type text DEFAULT 'percentage'
    CHECK (deposit_type IN ('percentage', 'fixed'));
  END IF;
END $$;

-- Add deposit_fixed_amount column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'deposit_fixed_amount'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN deposit_fixed_amount numeric(10,2) DEFAULT 20.00;
  END IF;
END $$;

-- Add multiply_deposit_by_services column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'multiply_deposit_by_services'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN multiply_deposit_by_services boolean DEFAULT false;
  END IF;
END $$;

-- Add stripe_webhook_secret column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_webhook_secret'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN stripe_webhook_secret text DEFAULT NULL;
  END IF;
END $$;
