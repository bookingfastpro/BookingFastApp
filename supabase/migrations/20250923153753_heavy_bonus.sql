/*
  # Add assigned_user_id column to bookings table

  1. Changes
    - Add `assigned_user_id` column to `bookings` table
    - Column type: uuid (nullable)
    - Foreign key reference to auth.users(id)
    - Add index for performance

  2. Security
    - No RLS changes needed (existing policies will apply)
*/

-- Add assigned_user_id column to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'assigned_user_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN assigned_user_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_assigned_user_id_fkey'
  ) THEN
    ALTER TABLE bookings 
    ADD CONSTRAINT bookings_assigned_user_id_fkey 
    FOREIGN KEY (assigned_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_user_id 
ON bookings (assigned_user_id);
