/*
  # Add iframe_services column to business_settings

  1. Changes
    - Add `iframe_services` column (text array)
    - Stores list of service IDs to display in iframe
    - Empty array means all services are shown
*/

-- Add iframe_services column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'iframe_services'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN iframe_services text[] DEFAULT '{}';
    
    COMMENT ON COLUMN business_settings.iframe_services IS 'List of service IDs to display in iframe booking page (empty means show all)';
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
