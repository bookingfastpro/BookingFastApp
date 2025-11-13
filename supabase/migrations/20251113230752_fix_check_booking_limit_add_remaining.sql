/*
  # Fix check_booking_limit to include remaining field
  
  ## Problem
  Function returns limit and current but not remaining field
  Frontend expects remaining to display "X réservations restantes"
  
  ## Solution
  Add remaining field to the returned jsonb object
  remaining = limit - current (or null if unlimited)
*/

DROP FUNCTION IF EXISTS check_booking_limit(uuid);

CREATE FUNCTION check_booking_limit(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_name text;
  v_booking_count integer;
  v_booking_limit integer;
  v_is_trial boolean;
BEGIN
  -- Get user's subscription plan and booking limit
  SELECT 
    COALESCE(sp.name, 'Free') as plan_name,
    COALESCE(sp.max_bookings_per_month, 10) as booking_limit,
    COALESCE(s.status = 'trial', false) as is_trial
  INTO v_plan_name, v_booking_limit, v_is_trial
  FROM profiles p
  LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status IN ('active', 'trial')
  LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE p.id = user_id_param;

  -- If no plan found, use free tier defaults
  IF v_plan_name IS NULL THEN
    v_plan_name := 'Free';
    v_booking_limit := 10;
    v_is_trial := false;
  END IF;

  -- -1 means unlimited
  IF v_booking_limit = -1 THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', null,
      'current', 0,
      'remaining', null,
      'plan', v_plan_name,
      'is_trial', v_is_trial
    );
  END IF;

  -- Count current month's bookings
  SELECT COUNT(*)
  INTO v_booking_count
  FROM bookings
  WHERE user_id = user_id_param
    AND created_at >= date_trunc('month', CURRENT_TIMESTAMP);

  -- Return result with remaining field
  RETURN jsonb_build_object(
    'allowed', v_booking_count < v_booking_limit,
    'limit', v_booking_limit,
    'current', v_booking_count,
    'remaining', v_booking_limit - v_booking_count,
    'plan', v_plan_name,
    'is_trial', v_is_trial
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_booking_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_limit(uuid) TO anon;
