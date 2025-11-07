/*
  # Fix RLS Policies for Plugin Permissions

  1. Changes
    - Add proper RLS policies for team_member_plugin_permissions table
    - Grant necessary permissions to authenticated users
    - Ensure owners can manage plugin permissions for their team members
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Owners can manage team plugin permissions" ON team_member_plugin_permissions;
DROP POLICY IF EXISTS "Admins can view team plugin permissions" ON team_member_plugin_permissions;

-- Grant necessary permissions
GRANT ALL ON team_member_plugin_permissions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Policy: Owners can manage all plugin permissions for their team members
CREATE POLICY "Owners can manage plugin permissions"
  ON team_member_plugin_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_member_plugin_permissions.team_member_id
      AND tm.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_member_plugin_permissions.team_member_id
      AND tm.owner_id = auth.uid()
    )
  );

-- Policy: Team members can view their own plugin permissions
CREATE POLICY "Members can view own plugin permissions"
  ON team_member_plugin_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_member_plugin_permissions.team_member_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Admins can view plugin permissions in their organization
CREATE POLICY "Admins can view plugin permissions"
  ON team_member_plugin_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm2.owner_id = tm1.owner_id
      WHERE tm1.user_id = auth.uid()
      AND tm1.role_name = 'admin'
      AND tm2.id = team_member_plugin_permissions.team_member_id
    )
  );
