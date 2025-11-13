/*
  # Add minimum booking delay hours column

  1. Changes
    - Add `minimum_booking_delay_hours` column to `business_settings` table
    - Set default value to 24 hours
    - Add index for performance

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

-- Add the minimum_booking_delay_hours column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'minimum_booking_delay_hours'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN minimum_booking_delay_hours integer DEFAULT 24;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_business_settings_minimum_booking_delay 
ON business_settings (minimum_booking_delay_hours);
