/*
  # Fix infinite recursion in team_members RLS and add missing columns

  1. Changes
    - Drop and recreate team_members RLS policies to avoid infinite recursion
    - Add missing `invited_at` column to team_invitations table
  
  2. Security
    - Maintain proper access control without recursion
    - Users can see their own team membership
    - Team owners can manage all members
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Team members can view their team" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;

-- Create non-recursive policies
CREATE POLICY "Users can view own membership"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view same team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t WHERE t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can insert members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t WHERE t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t WHERE t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t WHERE t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t WHERE t.owner_id = auth.uid()
    )
  );

-- Add missing invited_at column to team_invitations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_invitations' AND column_name = 'invited_at'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN invited_at timestamptz DEFAULT now();
    
    -- Update existing rows to use created_at as invited_at
    UPDATE team_invitations SET invited_at = created_at WHERE invited_at IS NULL;
    
    -- Make it NOT NULL after populating
    ALTER TABLE team_invitations ALTER COLUMN invited_at SET NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_at ON team_invitations(invited_at);
  END IF;
END $$;
