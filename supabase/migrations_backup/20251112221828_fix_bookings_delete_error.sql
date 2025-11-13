/*
  # Fix Bookings DELETE Error - Add Missing Data Column
  
  1. Problem
    - Error "record 'new' has no field 'data'" occurs when deleting bookings
    - The realtime replication system expects a 'data' column that doesn't exist
    
  2. Solution
    - Add an optional 'data' jsonb column to bookings table for metadata
    - This allows the realtime system to process events without errors
    - Default to empty jsonb object
    
  3. Impact
    - Fixes the DELETE operation errors
    - Provides a place to store additional booking metadata if needed
*/

-- Add data column to bookings table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
