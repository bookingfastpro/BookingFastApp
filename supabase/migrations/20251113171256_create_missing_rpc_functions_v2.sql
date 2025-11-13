/*
  # Create Missing RPC Functions
  
  Missing functions:
  - accept_team_invitation
  - get_team_member_plugin_permissions  
  - set_current_version
*/

-- accept_team_invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(
  p_invitation_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_team_member_id uuid;
BEGIN
  SELECT * INTO v_invitation
  FROM team_invitations
  WHERE id = p_invitation_id
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or expired');
  END IF;
  
  INSERT INTO team_members (team_id, user_id, email, role, permissions)
  VALUES (v_invitation.team_id, p_user_id, v_invitation.email, v_invitation.role, v_invitation.permissions)
  RETURNING id INTO v_team_member_id;
  
  UPDATE team_invitations SET status = 'accepted', accepted_at = now() WHERE id = p_invitation_id;
  
  RETURN jsonb_build_object('success', true, 'team_member_id', v_team_member_id, 'team_id', v_invitation.team_id);
END;
$$;

-- get_team_member_plugin_permissions
CREATE OR REPLACE FUNCTION get_team_member_plugin_permissions(
  p_team_member_id uuid,
  p_plugin_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permissions jsonb;
BEGIN
  SELECT permissions INTO v_permissions
  FROM team_member_plugin_permissions
  WHERE team_member_id = p_team_member_id AND plugin_id = p_plugin_id;
  
  RETURN COALESCE(v_permissions, '{}'::jsonb);
END;
$$;

-- set_current_version
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_versions SET is_current = false;
  UPDATE app_versions SET is_current = true WHERE id = version_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_team_invitation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_member_plugin_permissions(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_version(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
