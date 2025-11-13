/*
  # Add missing database functions and columns
  
  ## Changes
  1. Add missing columns to services table (availability_hours, unit_name)
  2. Create check_booking_limit function
  3. Recreate get_user_active_plugins function with correct signature
  
  ## New Columns
  - services.availability_hours (jsonb) - Store availability hours per day of week
  - services.unit_name (text) - Store the unit name for capacity (e.g., "participants", "personnes")
  
  ## Functions
  - check_booking_limit - Check if user has reached booking limit based on subscription
  - get_user_active_plugins - Get list of active plugins for a user
*/

-- ============================================================================
-- STEP 1: Add missing columns to services table
-- ============================================================================

-- Add availability_hours column (JSONB for flexible schedule storage)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'availability_hours'
  ) THEN
    ALTER TABLE services ADD COLUMN availability_hours jsonb;
  END IF;
END $$;

-- Add unit_name column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'unit_name'
  ) THEN
    ALTER TABLE services ADD COLUMN unit_name text DEFAULT 'participants';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create check_booking_limit function
-- ============================================================================

DROP FUNCTION IF EXISTS check_booking_limit(uuid);

CREATE FUNCTION check_booking_limit(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_tier text;
  v_booking_count integer;
  v_booking_limit integer;
  v_is_trial boolean;
BEGIN
  -- Get user's subscription tier
  SELECT 
    COALESCE(sp.tier, 'free') as tier,
    COALESCE(s.status = 'trial', false) as is_trial
  INTO v_subscription_tier, v_is_trial
  FROM profiles p
  LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status IN ('active', 'trial')
  LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE p.id = user_id_param;

  -- Set booking limit based on tier
  CASE v_subscription_tier
    WHEN 'superadmin' THEN v_booking_limit := -1; -- Unlimited
    WHEN 'pro' THEN v_booking_limit := -1; -- Unlimited
    WHEN 'basic' THEN v_booking_limit := 100;
    ELSE v_booking_limit := 10; -- Free tier
  END CASE;

  -- If unlimited, return early
  IF v_booking_limit = -1 THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', -1,
      'current', 0,
      'tier', v_subscription_tier,
      'is_trial', v_is_trial
    );
  END IF;

  -- Count current month's bookings
  SELECT COUNT(*)
  INTO v_booking_count
  FROM bookings
  WHERE user_id = user_id_param
    AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);

  -- Return result
  RETURN jsonb_build_object(
    'allowed', v_booking_count < v_booking_limit,
    'limit', v_booking_limit,
    'current', v_booking_count,
    'tier', v_subscription_tier,
    'is_trial', v_is_trial
  );
END;
$$;

-- ============================================================================
-- STEP 3: Recreate get_user_active_plugins function
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_active_plugins(uuid);

CREATE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE(
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  status text,
  current_period_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as plugin_id,
    p.name as plugin_name,
    p.slug as plugin_slug,
    ps.status,
    ps.current_period_end
  FROM plugin_subscriptions ps
  JOIN plugins p ON p.id = ps.plugin_id
  WHERE ps.user_id = p_user_id
    AND ps.status IN ('active', 'trial')
    AND (
      ps.current_period_end IS NULL 
      OR ps.current_period_end > now()
      OR (ps.grace_period_end IS NOT NULL AND ps.grace_period_end > now())
    )
  ORDER BY p.name;
END;
$$;

-- ============================================================================
-- STEP 4: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_booking_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_limit(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_user_active_plugins(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_plugins(uuid) TO anon;
