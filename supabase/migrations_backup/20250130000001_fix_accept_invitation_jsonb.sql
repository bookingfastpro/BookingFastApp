/*
  # Fix JSONB Type Casting in accept_team_invitation

  1. Changes
    - Fix permissions column type casting from text[] to JSONB
    - Ensure proper type conversion in INSERT statement
    - Add explicit JSONB casting for permissions array

  2. Security
    - Maintain existing RLS policies
    - Keep SECURITY DEFINER for proper permission handling
*/

-- Drop existing function
DROP FUNCTION IF EXISTS accept_team_invitation(uuid);

-- Recreate function with proper JSONB casting
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

  -- Create team member record with proper JSONB casting
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
    to_jsonb(invitation_record.permissions),  -- Convert text[] to JSONB
    invitation_record.role_name,
    true,
    now()
  )
  ON CONFLICT (owner_id, user_id) 
  DO UPDATE SET
    is_active = true,
    permissions = to_jsonb(EXCLUDED.permissions),  -- Convert text[] to JSONB
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
