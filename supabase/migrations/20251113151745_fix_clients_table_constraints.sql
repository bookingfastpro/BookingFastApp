/*
  # Fix clients table constraints
  
  ## Changes
  1. Make phone column nullable (it's currently NOT NULL but should be optional)
  2. Make firstname and lastname NOT NULL to match first_name and last_name
  3. Add default empty strings for backward compatibility
*/

-- Make phone nullable (it should be optional)
ALTER TABLE clients ALTER COLUMN phone DROP NOT NULL;

-- Make firstname and lastname NOT NULL to match first_name/last_name
-- First, fill any NULL values with empty strings
UPDATE clients SET firstname = '' WHERE firstname IS NULL;
UPDATE clients SET lastname = '' WHERE lastname IS NULL;

-- Then add NOT NULL constraints
ALTER TABLE clients ALTER COLUMN firstname SET NOT NULL;
ALTER TABLE clients ALTER COLUMN lastname SET NOT NULL;

-- Set default values to empty string
ALTER TABLE clients ALTER COLUMN firstname SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN lastname SET DEFAULT '';
