/*
  # Add twilio_enabled Column
  
  Missing twilio_enabled column in business_settings.
*/

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS twilio_enabled boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';
