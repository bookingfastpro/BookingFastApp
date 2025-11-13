/*
  # Add enable_user_assignment column to business_settings

  1. New Columns
    - `enable_user_assignment` (boolean, default false) - Enable user assignment for bookings

  2. Changes
    - Add column to business_settings table with default value false
    - This allows teams to assign bookings to specific users

  3. Security
    - No RLS changes needed as business_settings already has proper policies
*/

-- Add the enable_user_assignment column to business_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'enable_user_assignment'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN enable_user_assignment boolean DEFAULT false;
  END IF;
END $$;
