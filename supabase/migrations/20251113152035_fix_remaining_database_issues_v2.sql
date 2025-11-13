/*
  # Fix remaining database issues
  
  ## Issues Fixed
  1. Create users view (profiles table exists but code expects users table)
  2. Add missing columns to code_redemptions (access_granted_until, created_at, updated_at)
  3. Add team_member_limit alias for max_team_members in subscription_plans
  4. Create has_used_trial function
  
  ## Changes
  - Create a view that maps profiles to users for backward compatibility
  - Add timestamp columns to code_redemptions
  - Add team_member_limit column as alias
  - Create has_used_trial function to check if user has used a plugin trial
*/

-- ============================================================================
-- STEP 1: Create users view as alias for profiles
-- ============================================================================

-- Drop view if exists
DROP VIEW IF EXISTS users CASCADE;

-- Create view that maps profiles to users table structure
-- Only use columns that actually exist in profiles
CREATE VIEW users AS
SELECT 
  id,
  email,
  full_name,
  avatar_url,
  created_at,
  updated_at
FROM profiles;

-- Grant permissions on the view
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- ============================================================================
-- STEP 2: Add missing columns to code_redemptions
-- ============================================================================

-- Add access_granted_until column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'code_redemptions' AND column_name = 'access_granted_until'
  ) THEN
    ALTER TABLE code_redemptions ADD COLUMN access_granted_until timestamptz;
  END IF;
END $$;

-- Add created_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'code_redemptions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE code_redemptions ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add updated_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'code_redemptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE code_redemptions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add team_member_limit column to subscription_plans
-- ============================================================================

-- Add team_member_limit as alias for max_team_members
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'team_member_limit'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN team_member_limit integer;
  END IF;
END $$;

-- Copy max_team_members to team_member_limit
UPDATE subscription_plans
SET team_member_limit = max_team_members
WHERE team_member_limit IS NULL;

-- Create trigger to keep them in sync
DROP TRIGGER IF EXISTS sync_team_member_limit ON subscription_plans;
DROP FUNCTION IF EXISTS sync_team_member_limit();

CREATE FUNCTION sync_team_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync both columns
  IF NEW.team_member_limit IS NOT NULL THEN
    NEW.max_team_members := NEW.team_member_limit;
  END IF;
  
  IF NEW.max_team_members IS NOT NULL THEN
    NEW.team_member_limit := NEW.max_team_members;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_team_member_limit
  BEFORE INSERT OR UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_team_member_limit();

-- ============================================================================
-- STEP 4: Create has_used_trial function
-- ============================================================================

DROP FUNCTION IF EXISTS has_used_trial(uuid, uuid);

CREATE FUNCTION has_used_trial(p_plugin_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has ever had a trial subscription for this plugin
  RETURN EXISTS (
    SELECT 1
    FROM plugin_subscriptions
    WHERE user_id = p_user_id
      AND plugin_id = p_plugin_id
      AND status = 'trial'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION has_used_trial(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_used_trial(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION sync_team_member_limit() TO authenticated;
