/*
  # Fix Owner Plugin Access

  1. Corrections
    - Mise à jour de la fonction check_plugin_access pour mieux gérer l'accès propriétaire
    - Ajout de logs pour debug
*/

-- Fonction corrigée pour vérifier l'accès d'un membre à un plugin
CREATE OR REPLACE FUNCTION check_plugin_access(
  p_user_id uuid,
  p_plugin_slug text
)
RETURNS boolean AS $$
DECLARE
  v_is_owner boolean;
  v_has_permission boolean;
  v_owner_id uuid;
  v_plugin_id uuid;
BEGIN
  -- Récupérer l'ID du plugin
  SELECT id INTO v_plugin_id
  FROM plugins
  WHERE slug = p_plugin_slug;

  -- Si le plugin n'existe pas, pas d'accès
  IF v_plugin_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si l'utilisateur est propriétaire avec un abonnement actif
  SELECT EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    WHERE ps.user_id = p_user_id
    AND ps.plugin_id = v_plugin_id
    AND ps.status IN ('active', 'trial')
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ) INTO v_is_owner;

  -- Si propriétaire, accès automatique
  IF v_is_owner THEN
    RETURN true;
  END IF;

  -- Sinon, vérifier si c'est un membre d'équipe avec permission
  -- Trouver le propriétaire qui a l'abonnement et dont l'utilisateur est membre
  SELECT ps.user_id INTO v_owner_id
  FROM plugin_subscriptions ps
  JOIN team_members tm ON tm.owner_id = ps.user_id
  WHERE tm.user_id = p_user_id
  AND ps.plugin_id = v_plugin_id
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  AND tm.is_active = true
  LIMIT 1;

  -- Si pas de propriétaire trouvé, pas d'accès
  IF v_owner_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier la permission
  SELECT EXISTS (
    SELECT 1
    FROM team_member_plugin_permissions tmpp
    WHERE tmpp.team_member_id = (
      SELECT id FROM team_members 
      WHERE user_id = p_user_id 
      AND owner_id = v_owner_id
    )
    AND tmpp.owner_id = v_owner_id
    AND tmpp.plugin_id = v_plugin_id
    AND tmpp.can_access = true
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction corrigée pour obtenir les plugins accessibles
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
  FROM team_member_plugin_permissions tmpp
  JOIN plugins p ON p.id = tmpp.plugin_id
  JOIN users u ON u.id = tmpp.owner_id
  JOIN plugin_subscriptions ps ON ps.user_id = tmpp.owner_id AND ps.plugin_id = tmpp.plugin_id
  JOIN team_members tm ON tm.id = tmpp.team_member_id
  WHERE tm.user_id = p_user_id
  AND tmpp.can_access = true
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction corrigée pour obtenir les permissions d'un membre
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
    AND tmpp.team_member_id = p_member_id
    AND tmpp.owner_id = p_owner_id
  WHERE ps.user_id = p_owner_id
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
