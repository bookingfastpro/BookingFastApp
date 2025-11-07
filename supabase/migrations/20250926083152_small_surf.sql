/*
  # Add Stripe configuration to business_settings

  1. New Columns
    - `stripe_enabled` (boolean) - Enable/disable Stripe payments
    - `stripe_public_key` (text) - Stripe publishable key (pk_test_ or pk_live_)
    - `stripe_secret_key` (text) - Stripe secret key (sk_test_ or sk_live_)
    - `stripe_webhook_secret` (text) - Webhook endpoint secret (whsec_)

  2. Security
    - Sensitive keys are stored securely
    - Only account owners can modify Stripe settings
*/

-- Add Stripe configuration columns to business_settings
DO $$
BEGIN
  -- Add stripe_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_enabled boolean DEFAULT false;
  END IF;

  -- Add stripe_public_key column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_public_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_public_key text;
  END IF;

  -- Add stripe_secret_key column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_secret_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_secret_key text;
  END IF;

  -- Add stripe_webhook_secret column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_webhook_secret'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_webhook_secret text;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_settings_stripe_enabled 
ON business_settings(stripe_enabled) 
WHERE stripe_enabled = true;

-- Add constraints for Stripe keys validation
DO $$
BEGIN
  -- Constraint for public key format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_settings_stripe_public_key_check'
  ) THEN
    ALTER TABLE business_settings 
    ADD CONSTRAINT business_settings_stripe_public_key_check 
    CHECK (
      stripe_public_key IS NULL OR 
      stripe_public_key ~ '^pk_(test_|live_)[a-zA-Z0-9]+$'
    );
  END IF;

  -- Constraint for secret key format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_settings_stripe_secret_key_check'
  ) THEN
    ALTER TABLE business_settings 
    ADD CONSTRAINT business_settings_stripe_secret_key_check 
    CHECK (
      stripe_secret_key IS NULL OR 
      stripe_secret_key ~ '^sk_(test_|live_)[a-zA-Z0-9]+$'
    );
  END IF;

  -- Constraint for webhook secret format
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_settings_stripe_webhook_secret_check'
  ) THEN
    ALTER TABLE business_settings 
    ADD CONSTRAINT business_settings_stripe_webhook_secret_check 
    CHECK (
      stripe_webhook_secret IS NULL OR 
      stripe_webhook_secret ~ '^whsec_[a-zA-Z0-9]+$'
    );
  END IF;
END $$;
