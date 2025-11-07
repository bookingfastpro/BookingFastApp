/*
  # Add booking_status column to bookings table

  1. New Columns
    - `booking_status` (text, default 'pending')
      - Stores the status of the booking: 'pending' or 'confirmed'
      - Default value is 'pending' for new bookings
      - Includes check constraint to ensure only valid values

  2. Data Migration
    - Updates existing bookings to have 'pending' status by default
    - Ensures backward compatibility

  3. Constraints
    - Check constraint to validate booking_status values
    - Only allows 'pending' or 'confirmed' values
*/

-- Add the booking_status column to the bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_status text DEFAULT 'pending';
  END IF;
END $$;

-- Add check constraint to ensure only valid booking status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'bookings_booking_status_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check 
    CHECK (booking_status IN ('pending', 'confirmed'));
  END IF;
END $$;

-- Update existing bookings to have 'pending' status if null
UPDATE bookings 
SET booking_status = 'pending' 
WHERE booking_status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status 
ON bookings(booking_status);
