/*
  # Système de Permissions pour Plugins

  1. Nouvelles Tables
    - `team_member_plugin_permissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Membre de l'équipe
      - `owner_id` (uuid, foreign key) - Propriétaire qui a souscrit
      - `plugin_id` (uuid, foreign key) - Plugin concerné
      - `can_access` (boolean) - Accès au plugin
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé
    - Policies pour propriétaires et membres
    
  3. Fonctions
    - `check_plugin_access` - Vérifie l'accès d'un membre à un plugin
    - `get_member_accessible_plugins` - Liste des plugins accessibles pour un membre
*/

-- Table des permissions de plugins pour les membres d'équipe
CREATE TABLE IF NOT EXISTS team_member_plugin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  can_access boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, owner_id, plugin_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_team_plugin_permissions_user_id ON team_member_plugin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_team_plugin_permissions_owner_id ON team_member_plugin_permissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_plugin_permissions_plugin_id ON team_member_plugin_permissions(plugin_id);

-- RLS
ALTER TABLE team_member_plugin_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can manage team plugin permissions"
  ON team_member_plugin_permissions FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Members can view own plugin permissions"
  ON team_member_plugin_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Fonction pour vérifier l'accès d'un membre à un plugin
CREATE OR REPLACE FUNCTION check_plugin_access(
  p_user_id uuid,
  p_plugin_slug text
)
RETURNS boolean AS $$
DECLARE
  v_is_owner boolean;
  v_has_permission boolean;
  v_owner_id uuid;
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

  -- Sinon, vérifier si c'est un membre d'équipe avec permission
  -- Trouver le propriétaire qui a l'abonnement
  SELECT ps.user_id INTO v_owner_id
  FROM plugin_subscriptions ps
  JOIN plugins p ON p.id = ps.plugin_id
  JOIN team_members tm ON tm.owner_id = ps.user_id
  WHERE tm.user_id = p_user_id
  AND p.slug = p_plugin_slug
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
    JOIN plugins p ON p.id = tmpp.plugin_id
    WHERE tmpp.user_id = p_user_id
    AND tmpp.owner_id = v_owner_id
    AND p.slug = p_plugin_slug
    AND tmpp.can_access = true
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les plugins accessibles pour un membre
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
  WHERE tmpp.user_id = p_user_id
  AND tmpp.can_access = true
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les permissions d'un membre pour tous les plugins du propriétaire
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
    AND tmpp.user_id = p_member_id 
    AND tmpp.owner_id = p_owner_id
  WHERE ps.user_id = p_owner_id
  AND ps.status IN ('active', 'trial')
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
