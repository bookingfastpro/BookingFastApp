/*
  # Migration 02: Team Management System
  
  ## Overview
  Complete team collaboration system with roles and permissions
  
  ## Tables Created
  1. **teams**
     - id (uuid, primary key)
     - name (text, required)
     - owner_id (uuid, references auth.users)
     - created_at, updated_at (timestamptz)
  
  2. **team_members**
     - id (uuid, primary key)
     - team_id (uuid, references teams)
     - user_id (uuid, references auth.users)
     - role (text: owner, admin, member)
     - permissions (text array)
     - role_name (text)
     - is_active (boolean)
     - created_at, updated_at (timestamptz)
  
  3. **team_invitations**
     - id (uuid, primary key)
     - team_id (uuid, references teams)
     - email (text, required)
     - role (text)
     - permissions (text array)
     - role_name (text)
     - status (text: pending, accepted, declined, expired)
     - expires_at (timestamptz)
     - created_at, updated_at (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Team owners can manage their teams
  - Team members can view their team
  - Invited users can view their own invitations
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- TABLE: teams
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE teams IS 'Teams for multi-user collaboration';

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
  ON teams FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- TABLE: team_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions text[] DEFAULT ARRAY[]::text[],
  role_name text DEFAULT 'Membre',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

COMMENT ON TABLE team_members IS 'Team members with roles and permissions';

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

-- Update teams policy to allow members to view
DROP POLICY IF EXISTS "Team owners can view their teams" ON teams;
CREATE POLICY "Team owners and members can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: team_invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions text[] DEFAULT ARRAY[]::text[],
  role_name text DEFAULT 'Membre',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE team_invitations IS 'Team invitations for new members';

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage invitations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

CREATE POLICY "Invited users can view their invitations"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Invited users can update their invitations"
  ON team_invitations FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status) WHERE status = 'pending';

-- Grants
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_invitations TO authenticated;