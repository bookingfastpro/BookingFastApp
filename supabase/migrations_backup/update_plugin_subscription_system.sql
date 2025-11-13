/*
  # Mise à jour système d'abonnement plugins

  1. Modifications
    - Ajout champs trial dans plugin_subscriptions
    - Ajout fonction vérification accès avec trial
    - Mise à jour policies pour accès trial
    - Ajout table permissions plugins équipe

  2. Sécurité
    - RLS maintenu sur toutes les tables
    - Policies mises à jour pour trial et abonnements actifs
*/

-- Ajouter colonnes trial si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugin_subscriptions' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE plugin_subscriptions ADD COLUMN is_trial boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugin_subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE plugin_subscriptions ADD COLUMN trial_ends_at timestamptz;
  END IF;
END $$;

-- Table des permissions plugins pour membres d'équipe
CREATE TABLE IF NOT EXISTS team_member_plugin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  can_access boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, plugin_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_member_plugin_permissions_member ON team_member_plugin_permissions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_plugin_permissions_plugin ON team_member_plugin_permissions(plugin_id);

-- RLS
ALTER TABLE team_member_plugin_permissions ENABLE ROW LEVEL SECURITY;

-- Policies pour team_member_plugin_permissions
CREATE POLICY "Owners can manage team member plugin permissions"
  ON team_member_plugin_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_member_plugin_permissions.team_member_id
      AND tm.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view their own plugin permissions"
  ON team_member_plugin_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.id = team_member_plugin_permissions.team_member_id
      AND tm.user_id = auth.uid()
    )
  );

-- Fonction mise à jour pour vérifier accès plugin (avec trial et équipe)
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

  -- Vérifier si l'utilisateur a un abonnement actif ou trial valide
  IF EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    WHERE ps.user_id = p_user_id
    AND ps.plugin_id = v_plugin_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
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

  -- Vérifier si le propriétaire a le plugin
  IF NOT EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    WHERE ps.user_id = v_owner_id
    AND ps.plugin_id = v_plugin_id
    AND (
      (ps.status = 'active' AND (ps.current_period_end IS NULL OR ps.current_period_end > now()))
      OR
      (ps.status = 'trial' AND ps.trial_ends_at > now())
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

-- Fonction pour obtenir les plugins actifs (avec trial et équipe)
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
      ps.activated_features,
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
      ps.activated_features,
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
