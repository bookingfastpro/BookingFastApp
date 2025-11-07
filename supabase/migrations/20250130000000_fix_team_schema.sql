/*
  # Fix Team Management Schema

  1. Changes to team_members table
    - Add missing columns: firstname, lastname, phone
    - Keep existing columns: email, full_name, role_name, permissions
    - Add indexes for performance

  2. Create team_invitations table
    - Store pending team member invitations
    - Track invitation status and expiration
    - Link to owner and invited user

  3. Security
    - Enable RLS on both tables
    - Add policies for team management
*/

-- Add missing columns to team_members if they don't exist
DO $$ 
BEGIN
  -- Add firstname column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'firstname'
  ) THEN
    ALTER TABLE team_members ADD COLUMN firstname text;
  END IF;

  -- Add lastname column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'lastname'
  ) THEN
    ALTER TABLE team_members ADD COLUMN lastname text;
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'phone'
  ) THEN
    ALTER TABLE team_members ADD COLUMN phone text;
  END IF;

  -- Add role_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'role_name'
  ) THEN
    ALTER TABLE team_members ADD COLUMN role_name text DEFAULT 'employee';
  END IF;
END $$;

-- Migrate full_name to firstname/lastname if needed
UPDATE team_members 
SET 
  firstname = SPLIT_PART(full_name, ' ', 1),
  lastname = SPLIT_PART(full_name, ' ', 2)
WHERE firstname IS NULL AND full_name IS NOT NULL;

-- Create team_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  firstname text,
  lastname text,
  phone text,
  permissions text[] DEFAULT '{}',
  role_name text DEFAULT 'employee',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_owner ON team_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_members_firstname ON team_members(firstname);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can manage their team invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON team_invitations;

-- Policies for team_invitations
CREATE POLICY "Owners can manage their team invitations"
  ON team_invitations
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view invitations sent to them"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_id uuid)
RETURNS void AS $$
DECLARE
  invitation_record record;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE id = invitation_id
    AND email = auth.email()
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Create team member record
  INSERT INTO team_members (
    owner_id,
    user_id,
    email,
    firstname,
    lastname,
    phone,
    full_name,
    permissions,
    role_name,
    is_active,
    joined_at
  ) VALUES (
    invitation_record.owner_id,
    auth.uid(),
    invitation_record.email,
    invitation_record.firstname,
    invitation_record.lastname,
    invitation_record.phone,
    CONCAT_WS(' ', invitation_record.firstname, invitation_record.lastname),
    invitation_record.permissions,
    invitation_record.role_name,
    true,
    now()
  )
  ON CONFLICT (owner_id, user_id) 
  DO UPDATE SET
    is_active = true,
    permissions = EXCLUDED.permissions,
    role_name = EXCLUDED.role_name,
    updated_at = now();

  -- Update invitation status
  UPDATE team_invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_team_invitation(uuid) TO authenticated;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;
