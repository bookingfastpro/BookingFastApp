/*
  # Fix payment_links status constraint

  1. Changes
    - Drop existing status check constraint
    - Add new constraint that includes 'pending' and 'completed' statuses
  
  2. Reason
    - The code uses 'pending' and 'completed' statuses
    - Old constraint only allowed 'active', 'expired', 'used', 'cancelled'
    - Need to align database constraint with application logic
*/

-- Drop the old constraint
ALTER TABLE payment_links 
DROP CONSTRAINT IF EXISTS payment_links_status_check;

-- Add new constraint with correct status values
ALTER TABLE payment_links 
ADD CONSTRAINT payment_links_status_check 
CHECK (status IN ('pending', 'completed', 'expired', 'cancelled', 'active', 'used'));
