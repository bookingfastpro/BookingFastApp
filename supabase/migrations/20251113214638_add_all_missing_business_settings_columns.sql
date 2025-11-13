/*
  # Add All Missing Business Settings Columns
  
  ## Problem
  Many columns used in the code don't exist in business_settings table.
  
  ## Solution
  Add all missing columns to align with code expectations.
  
  ## Missing Columns
  - deposit_type, deposit_fixed_amount
  - minimum_booking_delay_hours, payment_link_expiry_minutes
  - stripe_enabled, stripe_public_key, stripe_secret_key, stripe_webhook_secret
  - multiply_deposit_by_services
  - business_email, business_phone, business_address
  - timezone, currency, date_format, time_format, week_start_day
*/

-- Deposit settings
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS deposit_type text DEFAULT 'percentage';

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS deposit_fixed_amount numeric DEFAULT 20;

-- Booking settings
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS minimum_booking_delay_hours integer DEFAULT 24;

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS payment_link_expiry_minutes integer DEFAULT 30;

-- Stripe settings
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS stripe_enabled boolean DEFAULT false;

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS stripe_public_key text;

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS stripe_secret_key text;

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS stripe_webhook_secret text;

-- Additional deposit settings
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS multiply_deposit_by_services boolean DEFAULT false;

-- Business info
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS business_email text;

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS business_phone text;

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS business_address text;

-- Localization settings
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Paris';

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS date_format text DEFAULT 'DD/MM/YYYY';

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS time_format text DEFAULT '24h';

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS week_start_day integer DEFAULT 1;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
