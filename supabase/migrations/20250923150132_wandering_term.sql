/*
  # Add user assignment feature to business settings

  1. Changes
    - Add `enable_user_assignment` column to `business_settings` table
    - Add `assigned_user_id` column to `bookings` table
    - Add foreign key constraint for user assignment
    - Add index for performance

  2. Security
    - No RLS changes needed (existing policies cover new columns)
*/

-- Add user assignment option to business settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'enable_user_assignment'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN enable_user_assignment boolean DEFAULT false;
  END IF;
END $$;

-- Add assigned user to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'assigned_user_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bookings' AND indexname = 'idx_bookings_assigned_user_id'
  ) THEN
    CREATE INDEX idx_bookings_assigned_user_id ON bookings(assigned_user_id);
  END IF;
END $$;
