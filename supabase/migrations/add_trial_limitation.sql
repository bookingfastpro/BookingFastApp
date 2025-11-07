/*
  # Limitation de l'essai gratuit à une seule utilisation

  1. Changes
    - Add trial_used column to track if user already used trial
    - Mark existing trials as used
    - Update subscription logic to prevent trial reuse

  2. Security
    - RLS policies maintained
    - Automatic tracking of trial usage
*/

-- Add trial_used column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugin_subscriptions' AND column_name = 'trial_used'
  ) THEN
    ALTER TABLE plugin_subscriptions ADD COLUMN trial_used boolean DEFAULT false;
    RAISE NOTICE '✅ Column trial_used added';
  ELSE
    RAISE NOTICE 'ℹ️ Column trial_used already exists';
  END IF;
END $$;

-- Mark all existing trials as used (including expired/cancelled ones)
UPDATE plugin_subscriptions
SET trial_used = true
WHERE is_trial = true OR status = 'trial';

-- Create function to check if user already used trial for a plugin
CREATE OR REPLACE FUNCTION has_used_trial(p_user_id uuid, p_plugin_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM plugin_subscriptions
    WHERE user_id = p_user_id
    AND plugin_id = p_plugin_id
    AND trial_used = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION has_used_trial(uuid, uuid) TO authenticated;

-- Create trigger to automatically mark trial as used when activated
CREATE OR REPLACE FUNCTION mark_trial_as_used()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a trial subscription, mark it as used
  IF NEW.is_trial = true OR NEW.status = 'trial' THEN
    NEW.trial_used := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_mark_trial_used ON plugin_subscriptions;

CREATE TRIGGER trigger_mark_trial_used
  BEFORE INSERT OR UPDATE ON plugin_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION mark_trial_as_used();

-- Add comment for documentation
COMMENT ON COLUMN plugin_subscriptions.trial_used IS 'Tracks if user has already used the 7-day trial for this plugin (one-time only)';
