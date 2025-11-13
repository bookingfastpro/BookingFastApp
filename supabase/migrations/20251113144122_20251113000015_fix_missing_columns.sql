/*
  # Migration 15: Fix Missing Columns and Functions
  
  ## Overview
  Add missing columns that the application expects
  
  ## Changes
  1. Add user_id to bookings for owner filtering
  2. Add is_featured to plugins
  3. Add restricted_visibility to team_members
  4. Fix get_user_active_plugins function parameter name
  
  ## Notes
  - These columns are needed for backward compatibility with the frontend
*/

-- ============================================================================
-- ADD MISSING COLUMNS TO BOOKINGS
-- ============================================================================

-- Add user_id to bookings for filtering by owner
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- ============================================================================
-- ADD MISSING COLUMNS TO PLUGINS
-- ============================================================================

-- Add is_featured flag for plugins
ALTER TABLE plugins ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_plugins_is_featured ON plugins(is_featured) WHERE is_featured = true;

-- ============================================================================
-- ADD MISSING COLUMNS TO TEAM_MEMBERS
-- ============================================================================

-- Add restricted_visibility for team member filtering
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS restricted_visibility boolean DEFAULT false;

-- ============================================================================
-- FIX GET_USER_ACTIVE_PLUGINS FUNCTION
-- ============================================================================

-- Drop and recreate the function with correct parameter name
DROP FUNCTION IF EXISTS get_user_active_plugins(uuid);

CREATE OR REPLACE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  expires_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    ps.current_period_end
  FROM plugins p
  JOIN plugin_subscriptions ps ON ps.plugin_id = p.id
  WHERE ps.user_id = p_user_id
    AND ps.status IN ('active', 'grace_period')
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now() OR ps.grace_period_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_active_plugins(uuid) IS 'Returns list of active plugins for a user with correct parameter name';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_active_plugins(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_plugins(uuid) TO anon;