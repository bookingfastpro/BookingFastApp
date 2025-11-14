/*
  # Fix payment_links description column

  1. Changes
    - Make `description` column nullable in `payment_links` table
    - Add default value for existing rows
  
  2. Reason
    - The column has a NOT NULL constraint but the code doesn't provide a value
    - Making it nullable allows payment links without explicit descriptions
*/

-- Make description column nullable
ALTER TABLE payment_links 
ALTER COLUMN description DROP NOT NULL;

-- Set a default description for any existing rows with null
UPDATE payment_links 
SET description = 'Paiement pour réservation' 
WHERE description IS NULL;
