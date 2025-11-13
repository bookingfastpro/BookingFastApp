/*
  # Fix Booking History Trigger for DELETE
  
  ## Problem
  The `track_booking_changes_trigger` executes AFTER DELETE and tries to insert
  into `booking_history` with a `booking_id` that references the deleted booking.
  This fails because of the foreign key constraint.
  
  ## Solution
  1. Drop the existing trigger
  2. Create separate triggers for INSERT/UPDATE (AFTER) and DELETE (BEFORE)
  3. For DELETE, record the history BEFORE the booking is deleted
  
  ## Changes
  - DELETE trigger now executes BEFORE DELETE
  - INSERT/UPDATE triggers remain AFTER (as they should be)
*/

-- Drop the existing trigger
DROP TRIGGER IF EXISTS track_booking_changes_trigger ON bookings;

-- Create BEFORE DELETE trigger
CREATE TRIGGER track_booking_changes_delete_trigger
  BEFORE DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION track_booking_changes();

-- Create AFTER INSERT trigger
CREATE TRIGGER track_booking_changes_insert_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION track_booking_changes();

-- Create AFTER UPDATE trigger
CREATE TRIGGER track_booking_changes_update_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION track_booking_changes();
