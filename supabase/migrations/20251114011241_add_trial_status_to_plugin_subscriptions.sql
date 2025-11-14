/*
  # Add trial status to plugin_subscriptions constraint

  1. Changes
    - Drop existing status check constraint
    - Recreate it with 'trial' status included
    - Allow plugin subscriptions to have trial status

  2. Security
    - Maintains data integrity with proper status values
*/

-- Drop the existing constraint
ALTER TABLE plugin_subscriptions 
DROP CONSTRAINT IF EXISTS plugin_subscriptions_status_check;

-- Add the new constraint with 'trial' included
ALTER TABLE plugin_subscriptions 
ADD CONSTRAINT plugin_subscriptions_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'cancelled'::text, 'past_due'::text, 'grace_period'::text, 'trial'::text]));

-- Add comment for documentation
COMMENT ON CONSTRAINT plugin_subscriptions_status_check ON plugin_subscriptions 
IS 'Valid status values: active, inactive, cancelled, past_due, grace_period, trial';
