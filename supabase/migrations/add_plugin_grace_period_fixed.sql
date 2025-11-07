/*
  # Add grace period support for plugin subscriptions

  1. Changes
    - Add current_period_end to track subscription end date
    - Update access control to respect grace period
    - DROP and recreate functions with new signatures

  2. Security
    - RLS policies maintained
    - Grace period enforced at database level
*/

-- Add current_period_end column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugin_subscriptions' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE plugin_subscriptions ADD COLUMN current_period_end timestamptz;
    RAISE NOTICE '✅ Column current_period_end added';
  END IF;
END $$;

-- 🔥 DROP existing function to allow signature change
DROP FUNCTION IF EXISTS get_user_active_plugins(uuid);

-- Update has_plugin_access function to respect grace period
CREATE OR REPLACE FUNCTION has_plugin_access(p_user_id uuid, p_plugin_slug text)
RETURNS boolean AS $$
DECLARE
  v_plugin_id uuid;
  v_team_member_id uuid;
  v_owner_id uuid;
BEGIN
  -- Récupérer l'ID du plugin
  SELECT id INTO v_plugin_id
  FROM plugins
  WHERE slug = p_plugin_slug AND is_active = true;

  IF v_plugin_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si l'utilisateur a un abonnement actif, trial valide, OU cancelled avec grace period
  IF EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    WHERE ps.user_id = p_user_id
    AND ps.plugin_id = v_plugin_id
    AND (
      -- Abonnement actif
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      -- Trial valide
      (ps.status = 'trial' AND ps.trial_ends_at > now())
      OR
      -- 🆕 Cancelled mais encore dans la grace period
      (ps.status = 'cancelled' AND ps.current_period_end IS NOT NULL AND ps.current_period_end > now())
    )
  ) THEN
    RETURN true;
  END IF;

  -- Vérifier si l'utilisateur est membre d'équipe
  SELECT tm.id, tm.owner_id INTO v_team_member_id, v_owner_id
  FROM team_members tm
  WHERE tm.user_id = p_user_id
  AND tm.is_active = true
  LIMIT 1;

  IF v_team_member_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si le propriétaire a le plugin (avec grace period)
  IF NOT EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    WHERE ps.user_id = v_owner_id
    AND ps.plugin_id = v_plugin_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
      OR
      (ps.status = 'cancelled' AND ps.current_period_end IS NOT NULL AND ps.current_period_end > now())
    )
  ) THEN
    RETURN false;
  END IF;

  -- Vérifier la permission du membre
  RETURN EXISTS (
    SELECT 1
    FROM team_member_plugin_permissions tmpp
    WHERE tmpp.team_member_id = v_team_member_id
    AND tmpp.plugin_id = v_plugin_id
    AND tmpp.can_access = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🆕 Recreate get_user_active_plugins with new signature (includes current_period_end)
CREATE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  plugin_icon text,
  plugin_category text,
  activated_features jsonb,
  settings jsonb,
  subscription_status text,
  current_period_end timestamptz
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
      ps.activated_features,
      COALESCE(pc.settings, '{}'::jsonb),
      ps.status,
      ps.current_period_end
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    LEFT JOIN plugin_configurations pc ON pc.user_id = v_owner_id AND pc.plugin_id = ps.plugin_id
    WHERE ps.user_id = v_owner_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
      OR
      (ps.status = 'cancelled' AND ps.current_period_end IS NOT NULL AND ps.current_period_end > now())
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
      ps.activated_features,
      COALESCE(pc.settings, '{}'::jsonb),
      ps.status,
      ps.current_period_end
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    LEFT JOIN plugin_configurations pc ON pc.user_id = ps.user_id AND pc.plugin_id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
      OR
      (ps.status = 'cancelled' AND ps.current_period_end IS NOT NULL AND ps.current_period_end > now())
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
