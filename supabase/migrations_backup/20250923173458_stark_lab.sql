/*
  # Add cancelled status to booking_status constraint

  1. Database Changes
    - Update the booking_status check constraint to include 'cancelled' status
    - This allows bookings to be marked as cancelled in addition to 'pending' and 'confirmed'

  2. Security
    - No changes to RLS policies needed
    - Existing policies will work with the new status

  3. Notes
    - Cancelled bookings will be excluded from upcoming bookings and pending payments in dashboard
    - The constraint ensures only valid statuses can be used
*/

-- Update the booking_status constraint to include 'cancelled'
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_booking_status_check' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_booking_status_check;
  END IF;
  
  -- Add the new constraint with 'cancelled' status
  ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check 
    CHECK (booking_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text]));
END $$;
