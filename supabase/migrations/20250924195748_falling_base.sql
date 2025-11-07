/*
  # Add custom_service_data column to bookings table

  1. Changes
    - Add `custom_service_data` column to `bookings` table
    - Column type: JSONB (allows storing custom service information)
    - Nullable: true (not all bookings will have custom service data)
    - Default: null

  2. Purpose
    - Store temporary custom service information for bookings with personalized pricing
    - Avoid creating permanent service records for one-time custom services
*/

-- Add custom_service_data column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS custom_service_data JSONB DEFAULT NULL;

-- Add index for better performance when querying custom service data
CREATE INDEX IF NOT EXISTS idx_bookings_custom_service_data 
ON bookings USING gin (custom_service_data);
