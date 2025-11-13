/*
  # Add Trial Columns to Plugin Subscriptions
  
  ## Changes
  - Add `is_trial` boolean column to track trial status
  - Add `trial_ends_at` timestamp column to track trial end date
  
  ## Purpose
  These columns are needed to properly track trial periods for plugin subscriptions.
*/

-- Add trial tracking columns to plugin_subscriptions
DO $$ 
BEGIN
  -- Add is_trial column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plugin_subscriptions' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE plugin_subscriptions 
    ADD COLUMN is_trial BOOLEAN DEFAULT false;
  END IF;

  -- Add trial_ends_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plugin_subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE plugin_subscriptions 
    ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing 'trial' status subscriptions to have is_trial = true
UPDATE plugin_subscriptions 
SET is_trial = true 
WHERE status = 'trial' AND is_trial IS NOT true;

NOTIFY pgrst, 'reload schema';
