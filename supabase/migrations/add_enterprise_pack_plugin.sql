/*
  # Ajout du plugin Enterprise Pack

  1. Nouveau Plugin
    - `entreprisepack` - Augmente la limite de membres d'équipe de 10 à 50
    
  2. Fonctionnalités
    - Limite de base: 10 membres
    - Avec pack: 50 membres
    - Prix: 49.99€/mois
*/

-- Insérer le plugin Enterprise Pack
INSERT INTO plugins (name, slug, description, icon, category, base_price, features, is_featured) VALUES
(
  'Pack Société',
  'entreprisepack',
  'Augmentez votre capacité d''équipe de 10 à 50 membres pour gérer une grande entreprise',
  'Building2',
  'management',
  49.99,
  '[
    {"id": "team_limit_50", "name": "50 membres d''équipe", "description": "Passez de 10 à 50 membres maximum", "included": true},
    {"id": "advanced_permissions", "name": "Permissions avancées", "description": "Gestion fine des permissions par membre", "included": true},
    {"id": "team_analytics", "name": "Analytiques d''équipe", "description": "Statistiques de performance par membre", "included": true},
    {"id": "bulk_operations", "name": "Opérations en masse", "description": "Gérez plusieurs membres simultanément", "included": false, "price": 15.00},
    {"id": "custom_roles", "name": "Rôles personnalisés", "description": "Créez vos propres rôles", "included": false, "price": 20.00}
  ]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  base_price = EXCLUDED.base_price,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

-- Fonction pour obtenir la limite de membres d'équipe
CREATE OR REPLACE FUNCTION get_team_member_limit(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_has_enterprise_pack boolean;
BEGIN
  -- Vérifier si l'utilisateur a le pack entreprise actif
  SELECT EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND p.slug = 'entreprisepack'
    AND ps.status IN ('active', 'trial')
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ) INTO v_has_enterprise_pack;

  -- Retourner la limite selon le pack
  IF v_has_enterprise_pack THEN
    RETURN 50;
  ELSE
    RETURN 10;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si on peut ajouter un membre
CREATE OR REPLACE FUNCTION can_add_team_member(p_owner_id uuid)
RETURNS boolean AS $$
DECLARE
  v_current_count integer;
  v_limit integer;
BEGIN
  -- Compter les membres actuels (actifs uniquement)
  SELECT COUNT(*)
  INTO v_current_count
  FROM team_members
  WHERE owner_id = p_owner_id
  AND is_active = true;

  -- Obtenir la limite
  v_limit := get_team_member_limit(p_owner_id);

  -- Retourner si on peut ajouter
  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'équipe
CREATE OR REPLACE FUNCTION get_team_stats(p_owner_id uuid)
RETURNS TABLE (
  current_members integer,
  member_limit integer,
  available_slots integer,
  has_enterprise_pack boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM team_members WHERE owner_id = p_owner_id AND is_active = true),
    get_team_member_limit(p_owner_id),
    get_team_member_limit(p_owner_id) - (SELECT COUNT(*)::integer FROM team_members WHERE owner_id = p_owner_id AND is_active = true),
    EXISTS (
      SELECT 1
      FROM plugin_subscriptions ps
      JOIN plugins p ON p.id = ps.plugin_id
      WHERE ps.user_id = p_owner_id
      AND p.slug = 'entreprisepack'
      AND ps.status IN ('active', 'trial')
      AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
