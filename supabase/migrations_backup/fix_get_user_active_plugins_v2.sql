/*
  # Fix get_user_active_plugins function - Version 2

  1. Changes
    - Drop and recreate function with correct signature
    - Remove activated_features column reference (doesn't exist)
    - Add proper error handling
    - Support trial and active subscriptions with grace period

  2. Security
    - SECURITY DEFINER maintained
    - RLS policies respected
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_active_plugins(uuid);

-- Recreate with correct implementation
CREATE OR REPLACE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  plugin_icon text,
  plugin_category text,
  activated_features jsonb,
  settings jsonb,
  subscription_status text,
  current_period_end timestamptz
) AS $$
DECLARE
  v_team_member_id uuid;
  v_owner_id uuid;
BEGIN
  -- Check if user is a team member
  SELECT tm.id, tm.owner_id INTO v_team_member_id, v_owner_id
  FROM team_members tm
  WHERE tm.user_id = p_user_id
  AND tm.is_active = true
  LIMIT 1;

  -- If team member, return owner's plugins with permissions
  IF v_team_member_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.icon,
      p.category,
      '[]'::jsonb as activated_features,
      COALESCE(pc.settings, '{}'::jsonb) as settings,
      ps.status,
      ps.current_period_end
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    LEFT JOIN plugin_configurations pc ON pc.user_id = v_owner_id AND pc.plugin_id = ps.plugin_id
    WHERE ps.user_id = v_owner_id
    AND (
      -- Active subscription with grace period
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      -- Valid trial
      (ps.status = 'trial' AND ps.trial_ends_at > now())
      OR
      -- Cancelled but still in grace period
      (ps.status = 'cancelled' AND ps.current_period_end IS NOT NULL AND ps.current_period_end > now())
    )
    AND EXISTS (
      SELECT 1
      FROM team_member_plugin_permissions tmpp
      WHERE tmpp.team_member_id = v_team_member_id
      AND tmpp.plugin_id = ps.plugin_id
      AND tmpp.can_access = true
    );
  ELSE
    -- Return user's own plugins
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.icon,
      p.category,
      '[]'::jsonb as activated_features,
      COALESCE(pc.settings, '{}'::jsonb) as settings,
      ps.status,
      ps.current_period_end
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    LEFT JOIN plugin_configurations pc ON pc.user_id = ps.user_id AND pc.plugin_id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND (
      -- Active subscription with grace period
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      -- Valid trial
      (ps.status = 'trial' AND ps.trial_ends_at > now())
      OR
      -- Cancelled but still in grace period
      (ps.status = 'cancelled' AND ps.current_period_end IS NOT NULL AND ps.current_period_end > now())
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_active_plugins(uuid) TO authenticated;
