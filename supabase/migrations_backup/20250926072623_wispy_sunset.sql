/*
  # Fix services RLS policy for team members

  1. Security Updates
    - Update RLS policy on `services` table to allow team members to view owner's services
    - Allow team members to access services based on their team membership

  2. Changes
    - Modify existing policy to include team member access
    - Team members can view services where they have team access to the owner
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage own services" ON services;

-- Create new policy that allows both owners and team members to access services
CREATE POLICY "Users and team members can access services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    -- Owner can access their own services
    (auth.uid() = user_id) 
    OR 
    -- Team members can access services of their owner
    (EXISTS (
      SELECT 1 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = services.user_id 
        AND tm.is_active = true
        AND tm.permissions ? 'view_services'
    ))
  )
  WITH CHECK (
    -- Owner can manage their own services
    (auth.uid() = user_id) 
    OR 
    -- Team members can manage services if they have the right permissions
    (EXISTS (
      SELECT 1 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = services.user_id 
        AND tm.is_active = true
        AND (
          tm.permissions ? 'create_service' 
          OR tm.permissions ? 'edit_service' 
          OR tm.permissions ? 'delete_service'
        )
    ))
  );
