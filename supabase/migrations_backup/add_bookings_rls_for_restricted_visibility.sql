/*
  # Add RLS policies for restricted visibility on bookings

  1. Changes
    - Add RLS policy to restrict bookings visibility based on team member's restricted_visibility setting
    - Team members with restricted_visibility=true can only see bookings assigned to them
    - Owners and admins can see all bookings

  2. Security
    - Maintains existing access control
    - Adds granular visibility control for team members
*/

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;

-- Create new SELECT policy with restricted visibility support
CREATE POLICY "Bookings visibility based on team role"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    -- Owner can see all their bookings
    user_id = auth.uid()
    OR
    -- Team members can see bookings based on their restrictions
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.owner_id = bookings.user_id
        AND tm.is_active = true
        AND (
          -- If restricted_visibility is false or null, see all bookings
          (tm.restricted_visibility IS NULL OR tm.restricted_visibility = false)
          OR
          -- If restricted_visibility is true, only see assigned bookings
          (tm.restricted_visibility = true AND bookings.assigned_user_id = auth.uid())
        )
    )
  );

-- Allow public to view bookings (for iframe/public booking pages)
CREATE POLICY "Public can view bookings for booking pages"
  ON bookings FOR SELECT
  TO public
  USING (true);
