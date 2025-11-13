/*
  # Fix Infinite Recursion in Team RLS Policies
  
  ## Problem
  Circular dependencies between teams and team_members RLS policies causing:
  "infinite recursion detected in policy for relation 'team_members'"
  
  ## Changes
  1. Populate owner_id in team_members table from teams table
  2. Drop all recursive RLS policies on teams and team_members
  3. Create new non-recursive policies using direct column checks
  4. Add trigger to auto-populate owner_id for new team members
  5. Fix team_invitations policies to avoid recursion
  
  ## Security
  - Team owners can manage all members by checking owner_id directly
  - Team members can view their own membership
  - No circular policy dependencies
*/

-- ============================================================================
-- STEP 1: Populate owner_id in team_members
-- ============================================================================

-- First, populate owner_id for existing team_members by joining with teams
UPDATE team_members tm
SET owner_id = t.owner_id
FROM teams t
WHERE tm.team_id = t.id
  AND tm.owner_id IS NULL;

-- Make owner_id NOT NULL after populating
ALTER TABLE team_members ALTER COLUMN owner_id SET NOT NULL;

-- ============================================================================
-- STEP 2: Drop ALL existing policies that cause recursion
-- ============================================================================

-- Drop team_members policies
DROP POLICY IF EXISTS "Team members can view their team" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can view own membership" ON team_members;
DROP POLICY IF EXISTS "Users can view same team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can insert members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON team_members;
DROP POLICY IF EXISTS "Team owners can delete members" ON team_members;

-- Drop teams policies
DROP POLICY IF EXISTS "Team owners can view their teams" ON teams;
DROP POLICY IF EXISTS "Team owners and members can view their teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;

-- Drop team_invitations policies
DROP POLICY IF EXISTS "Team owners can manage invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invited users can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invited users can update their invitations" ON team_invitations;

-- ============================================================================
-- STEP 3: Create NON-RECURSIVE policies for team_members
-- ============================================================================

-- Policy 1: Users can view their own team membership
CREATE POLICY "Users can view own team membership"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Team owners can view all their team members
CREATE POLICY "Team owners can view all team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy 3: Team owners can insert new members
CREATE POLICY "Team owners can insert team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy 4: Team owners can update their team members
CREATE POLICY "Team owners can update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy 5: Team owners can delete team members
CREATE POLICY "Team owners can delete team members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- STEP 4: Create NON-RECURSIVE policies for teams
-- ============================================================================

-- Policy 1: Team owners can view their teams
CREATE POLICY "Owners can view their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy 2: Users can create teams
CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy 3: Team owners can update their teams
CREATE POLICY "Owners can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy 4: Team owners can delete their teams
CREATE POLICY "Owners can delete their teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- STEP 5: Create NON-RECURSIVE policies for team_invitations
-- ============================================================================

-- Add invited_by_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_invitations' AND column_name = 'invited_by_user_id'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON team_invitations(invited_by_user_id);
  END IF;
END $$;

-- Populate invited_by_user_id from teams owner_id for existing invitations
UPDATE team_invitations ti
SET invited_by_user_id = t.owner_id
FROM teams t
WHERE ti.team_id = t.id
  AND ti.invited_by_user_id IS NULL;

-- Policy 1: Users who created invitations can manage them
CREATE POLICY "Invitation creators can manage invitations"
  ON team_invitations
  FOR ALL
  TO authenticated
  USING (invited_by_user_id = auth.uid())
  WITH CHECK (invited_by_user_id = auth.uid());

-- Policy 2: Invited users can view their own invitations by email
CREATE POLICY "Users can view their own invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy 3: Invited users can update their invitation status
CREATE POLICY "Users can update their invitation status"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 6: Create trigger to auto-populate owner_id for new team members
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_team_member_owner_id ON team_members;
DROP FUNCTION IF EXISTS set_team_member_owner_id();

-- Create function to set owner_id from team
CREATE OR REPLACE FUNCTION set_team_member_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set owner_id if it's not already set
  IF NEW.owner_id IS NULL THEN
    SELECT owner_id INTO NEW.owner_id
    FROM teams
    WHERE id = NEW.team_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER set_team_member_owner_id
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION set_team_member_owner_id();

-- ============================================================================
-- STEP 7: Grant necessary permissions
-- ============================================================================

GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_invitations TO authenticated;

-- Grant access to the trigger function
GRANT EXECUTE ON FUNCTION set_team_member_owner_id() TO authenticated;
