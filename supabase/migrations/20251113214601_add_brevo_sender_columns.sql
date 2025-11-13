/*
  # Add Brevo Sender Columns to Business Settings
  
  ## Problem
  Code uses brevo_sender_email and brevo_sender_name but they don't exist in business_settings table.
  
  ## Solution
  Add the missing Brevo sender columns.
  
  ## Changes
  - Add brevo_sender_email column
  - Add brevo_sender_name column
*/

-- Add brevo_sender_email
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS brevo_sender_email text;

-- Add brevo_sender_name
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS brevo_sender_name text DEFAULT 'BookingFast';

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
