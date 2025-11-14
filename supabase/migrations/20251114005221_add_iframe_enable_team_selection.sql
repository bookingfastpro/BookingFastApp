/*
  # Add iframe team selection option

  1. Changes
    - Add `iframe_enable_team_selection` column to business_settings
    - Allows clients to choose a team member during public booking
*/

-- Add column for enabling team member selection in iframe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' AND column_name = 'iframe_enable_team_selection'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN iframe_enable_team_selection boolean DEFAULT false;
    
    COMMENT ON COLUMN business_settings.iframe_enable_team_selection IS 'Allows clients to select a team member in the public booking iframe';
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
