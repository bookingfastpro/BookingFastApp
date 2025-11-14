/*
  # Create get_blocked_date_ranges RPC function

  1. Purpose
    - Create an RPC function to retrieve blocked date ranges for a user
    - Bypasses RLS using SECURITY DEFINER (called with service role)
    - Used by the public-booking-data edge function

  2. Function Details
    - Name: get_blocked_date_ranges
    - Parameter: p_user_id (UUID)
    - Returns: TABLE with blocked date ranges
    - Security: DEFINER (runs with function owner's privileges)

  3. Returns
    - id: UUID of the blocked date range
    - start_date: Start date of the blocked range
    - end_date: End date of the blocked range
    - reason: Optional reason for blocking
    - user_id: User ID who created the block
*/

-- Create function to get blocked date ranges for a user
CREATE OR REPLACE FUNCTION get_blocked_date_ranges(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  start_date DATE,
  end_date DATE,
  reason TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bdr.id,
    bdr.start_date,
    bdr.end_date,
    bdr.reason,
    bdr.user_id,
    bdr.created_at
  FROM blocked_date_ranges bdr
  WHERE bdr.user_id = p_user_id
  ORDER BY bdr.start_date ASC;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_blocked_date_ranges(UUID) TO authenticated, service_role, anon;

-- Add comment to the function
COMMENT ON FUNCTION get_blocked_date_ranges IS 'Retrieve blocked date ranges for a specific user (bypasses RLS)';
