/*
  # Add deposit multiplication setting

  1. Changes
    - Add multiply_deposit_by_services boolean field to business_settings
    - Default to false to maintain existing behavior

  2. Notes
    - When enabled, deposit amount will be multiplied by quantity of services
*/

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
