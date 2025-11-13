/*
  # Add missing columns to bookings table
  
  ## Missing Columns
  - booking_status (text) - Status of the booking (confirmed, cancelled, pending, etc.)
  - transactions (jsonb) - Payment transaction details
  - custom_service_data (jsonb) - Custom data for service bookings
  - send_email_notification (boolean) - Whether to send email notifications
  - send_sms_notification (boolean) - Whether to send SMS notifications
*/

-- Add booking_status column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'booking_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_status text DEFAULT 'confirmed';
  END IF;
END $$;

-- Add transactions column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'transactions'
  ) THEN
    ALTER TABLE bookings ADD COLUMN transactions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add custom_service_data column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'custom_service_data'
  ) THEN
    ALTER TABLE bookings ADD COLUMN custom_service_data jsonb;
  END IF;
END $$;

-- Add send_email_notification column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'send_email_notification'
  ) THEN
    ALTER TABLE bookings ADD COLUMN send_email_notification boolean DEFAULT true;
  END IF;
END $$;

-- Add send_sms_notification column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'send_sms_notification'
  ) THEN
    ALTER TABLE bookings ADD COLUMN send_sms_notification boolean DEFAULT false;
  END IF;
END $$;
