/*
  # Add availability hours to services table

  1. Schema Changes
    - Add `availability_hours` column to `services` table
    - Column type: JSONB to store flexible schedule data
    - Default value: NULL (will use business opening hours as fallback)

  2. Data Structure
    - JSON object with days of week as keys
    - Each day has: start time, end time, closed boolean
    - Example: {"monday": {"start": "09:00", "end": "17:00", "closed": false}}

  3. Migration Safety
    - Uses IF NOT EXISTS to prevent errors
    - Non-destructive addition of new column
    - Existing services will use business hours as fallback
*/

-- Add availability_hours column to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'availability_hours'
  ) THEN
    ALTER TABLE services ADD COLUMN availability_hours JSONB DEFAULT NULL;
    
    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS idx_services_availability_hours 
    ON services USING gin (availability_hours);
    
    -- Add comment for documentation
    COMMENT ON COLUMN services.availability_hours IS 'Service-specific availability hours. If null, uses business opening hours.';
    
    RAISE NOTICE 'Added availability_hours column to services table';
  ELSE
    RAISE NOTICE 'availability_hours column already exists in services table';
  END IF;
END $$;
