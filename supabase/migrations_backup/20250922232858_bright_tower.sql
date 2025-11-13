/*
  # Add timezone support to business settings

  1. Changes
    - Add `timezone` column to `business_settings` table
    - Set default timezone to 'Europe/Paris'
    - Update existing records with default timezone

  2. Notes
    - Timezone will be used for all date/time operations
    - Supports IANA timezone identifiers
    - Default to Central European Time
*/

-- Add timezone column to business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN timezone text DEFAULT 'Europe/Paris' NOT NULL;
  END IF;
END $$;

-- Update existing records to have the default timezone
UPDATE business_settings 
SET timezone = 'Europe/Paris' 
WHERE timezone IS NULL OR timezone = '';

-- Add index for timezone queries
CREATE INDEX IF NOT EXISTS idx_business_settings_timezone 
ON business_settings(timezone);

-- Add constraint to ensure valid timezone format
ALTER TABLE business_settings 
ADD CONSTRAINT business_settings_timezone_check 
CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$' OR timezone = 'UTC');
