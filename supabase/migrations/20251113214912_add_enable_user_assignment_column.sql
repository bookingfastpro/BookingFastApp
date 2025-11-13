/*
  # Add enable_user_assignment Column to Business Settings
  
  ## Problem
  Code uses enable_user_assignment but it doesn't exist in business_settings.
  
  ## Solution
  Add the missing column.
*/

ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS enable_user_assignment boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';
