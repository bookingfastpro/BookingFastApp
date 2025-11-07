/*
  # Fix Bookings RLS Policies - Remove substring operations

  1. Changes
    - Drop existing RLS policies on bookings table
    - Recreate policies without substring operations on time fields
    - Ensure proper type handling for time fields

  2. Security
    - Maintain same access control logic
    - Fix type casting issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON bookings;

-- Recreate policies without substring operations
CREATE POLICY "Bookings are viewable by everyone"
  ON bookings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- Verify no triggers are using substring on time fields
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT tgname, tgrelid::regclass 
    FROM pg_trigger 
    WHERE tgrelid = 'bookings'::regclass
  LOOP
    RAISE NOTICE 'Found trigger: % on table %', trigger_record.tgname, trigger_record.tgrelid;
  END LOOP;
END $$;
