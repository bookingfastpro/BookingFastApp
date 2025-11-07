/*
  # Fix Plugin Permissions Schema

  1. Changes
    - Update RPC function to use correct column name (team_member_id)
    - Fix unique constraint to match actual schema
    
  2. Notes
    - The table already has team_member_id column
    - Migration file had wrong column name (user_id)
*/

-- Drop and recreate the RPC function with correct column name
DROP FUNCTION IF EXISTS get_team_member_plugin_permissions(uuid, uuid);

CREATE OR REPLACE FUNCTION get_team_member_plugin_permissions(
  p_owner_id uuid,
  p_member_id uuid
)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  plugin_icon text,
  can_access boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.icon,
    COALESCE(tmpp.can_access, false) as can_access
  FROM plugin_subscriptions ps
  JOIN plugins p ON p.id = ps.plugin_id
  LEFT JOIN team_member_plugin_permissions tmpp 
    ON tmpp.plugin_id = p.id 
    AND tmpp.team_member_id = p_member_id  -- ✅ CORRECT : team_member_id
    AND tmpp.owner_id = p_owner_id
  WHERE ps.user_id = p_owner_id
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update check_plugin_access function
DROP FUNCTION IF EXISTS check_plugin_access(uuid, text);

CREATE OR REPLACE FUNCTION check_plugin_access(
  p_user_id uuid,
  p_plugin_slug text
)
RETURNS boolean AS $$
DECLARE
  v_is_owner boolean;
  v_has_permission boolean;
  v_owner_id uuid;
  v_team_member_id uuid;
BEGIN
  -- Vérifier si l'utilisateur est propriétaire avec un abonnement actif
  SELECT EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND p.slug = p_plugin_slug
    AND ps.status IN ('active', 'trial')
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ) INTO v_is_owner;

  -- Si propriétaire, accès automatique
  IF v_is_owner THEN
    RETURN true;
  END IF;

  -- Trouver le team_member_id et owner_id
  SELECT tm.id, tm.owner_id INTO v_team_member_id, v_owner_id
  FROM team_members tm
  JOIN plugin_subscriptions ps ON ps.user_id = tm.owner_id
  JOIN plugins p ON p.id = ps.plugin_id
  WHERE tm.user_id = p_user_id
  AND p.slug = p_plugin_slug
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  AND tm.is_active = true
  LIMIT 1;

  -- Si pas de team member trouvé, pas d'accès
  IF v_team_member_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier la permission
  SELECT EXISTS (
    SELECT 1
    FROM team_member_plugin_permissions tmpp
    JOIN plugins p ON p.id = tmpp.plugin_id
    WHERE tmpp.team_member_id = v_team_member_id  -- ✅ CORRECT
    AND tmpp.owner_id = v_owner_id
    AND p.slug = p_plugin_slug
    AND tmpp.can_access = true
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_member_accessible_plugins function
DROP FUNCTION IF EXISTS get_member_accessible_plugins(uuid);

CREATE OR REPLACE FUNCTION get_member_accessible_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  plugin_icon text,
  plugin_category text,
  owner_id uuid,
  owner_email text,
  can_access boolean
) AS $$
BEGIN
  RETURN QUERY
  -- Plugins dont l'utilisateur est propriétaire
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.icon,
    p.category,
    ps.user_id as owner_id,
    u.email as owner_email,
    true as can_access
  FROM plugin_subscriptions ps
  JOIN plugins p ON p.id = ps.plugin_id
  JOIN users u ON u.id = ps.user_id
  WHERE ps.user_id = p_user_id
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now())

  UNION

  -- Plugins accessibles via permissions d'équipe
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.icon,
    p.category,
    tmpp.owner_id,
    u.email as owner_email,
    tmpp.can_access
  FROM team_members tm
  JOIN team_member_plugin_permissions tmpp ON tmpp.team_member_id = tm.id  -- ✅ CORRECT
  JOIN plugins p ON p.id = tmpp.plugin_id
  JOIN users u ON u.id = tmpp.owner_id
  JOIN plugin_subscriptions ps ON ps.user_id = tmpp.owner_id AND ps.plugin_id = tmpp.plugin_id
  WHERE tm.user_id = p_user_id
  AND tmpp.can_access = true
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
