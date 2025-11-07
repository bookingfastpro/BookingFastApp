/*
  # Correction fonction get_user_active_plugins

  1. Modifications
    - Suppression référence colonne activated_features
    - Retour d'un tableau JSON vide à la place
    - Support trial et abonnements actifs

  2. Sécurité
    - RLS maintenu
    - SECURITY DEFINER pour accès contrôlé
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_user_active_plugins(uuid);

-- Recréer la fonction corrigée
CREATE OR REPLACE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  plugin_icon text,
  plugin_category text,
  activated_features jsonb,
  settings jsonb
) AS $$
DECLARE
  v_team_member_id uuid;
  v_owner_id uuid;
BEGIN
  -- Vérifier si l'utilisateur est membre d'équipe
  SELECT tm.id, tm.owner_id INTO v_team_member_id, v_owner_id
  FROM team_members tm
  WHERE tm.user_id = p_user_id
  AND tm.is_active = true
  LIMIT 1;

  -- Si membre d'équipe, retourner les plugins du propriétaire avec permissions
  IF v_team_member_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.icon,
      p.category,
      '[]'::jsonb as activated_features,
      COALESCE(pc.settings, '{}'::jsonb)
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    LEFT JOIN plugin_configurations pc ON pc.user_id = v_owner_id AND pc.plugin_id = ps.plugin_id
    WHERE ps.user_id = v_owner_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
    )
    AND EXISTS (
      SELECT 1
      FROM team_member_plugin_permissions tmpp
      WHERE tmpp.team_member_id = v_team_member_id
      AND tmpp.plugin_id = ps.plugin_id
      AND tmpp.can_access = true
    );
  ELSE
    -- Sinon, retourner les plugins de l'utilisateur
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.icon,
      p.category,
      '[]'::jsonb as activated_features,
      COALESCE(pc.settings, '{}'::jsonb)
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    LEFT JOIN plugin_configurations pc ON pc.user_id = ps.user_id AND pc.plugin_id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
