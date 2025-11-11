/*
  # Add notification preferences to bookings

  1. Changes
    - Add `send_email_notification` column to bookings table (boolean, default true)
    - Add `send_sms_notification` column to bookings table (boolean, default true)
  
  2. Purpose
    - Store user preferences for email and SMS notifications per booking
    - Allow users to control whether notifications are sent when creating/updating bookings
    - Persist notification preferences so they can be restored when editing bookings

  3. Notes
    - Default values are set to `true` to maintain current behavior
    - These fields are optional and will not break existing bookings
*/

-- Add notification preference columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'send_email_notification'
  ) THEN
    ALTER TABLE bookings ADD COLUMN send_email_notification boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'send_sms_notification'
  ) THEN
    ALTER TABLE bookings ADD COLUMN send_sms_notification boolean DEFAULT true;
  END IF;
END $$;