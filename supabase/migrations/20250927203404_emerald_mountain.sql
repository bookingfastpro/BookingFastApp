/*
  # Add iframe services configuration

  1. New Column
    - Add `iframe_services` column to `business_settings` table
    - JSONB array to store selected service IDs for iframe display
    - Default to empty array (show all services)

  2. Purpose
    - Allow users to configure which services appear on their iframe booking page
    - Enable creation of specialized booking pages for different services
    - Maintain backward compatibility (empty array = show all services)
*/

-- Add iframe_services column to business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'iframe_services'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN iframe_services JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN business_settings.iframe_services IS 'Array of service IDs to display on iframe booking page. Empty array means show all services.';
  END IF;
END $$;
