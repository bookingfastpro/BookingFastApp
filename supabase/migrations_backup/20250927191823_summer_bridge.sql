/*
  # Add unit_name field to services table

  1. New Columns
    - `unit_name` (text, optional) - Custom name for the service unit (e.g., "Jet ski", "Vélo", "Chambre")
      This will replace "participants" in booking forms to make it more contextual

  2. Changes
    - Add unit_name column to services table with default null
    - Update existing services to have default unit names where appropriate

  3. Notes
    - This field is optional and defaults to null
    - When null, the booking form will use "participants" as default
    - When set, it will display "Nombre de [unit_name]" instead of "Nombre de participants"
*/

-- Add unit_name column to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'unit_name'
  ) THEN
    ALTER TABLE services ADD COLUMN unit_name text;
  END IF;
END $$;

-- Add comment to the new column
COMMENT ON COLUMN services.unit_name IS 'Custom name for the service unit (e.g., "Jet ski", "Vélo", "Chambre") - replaces "participants" in booking forms';
