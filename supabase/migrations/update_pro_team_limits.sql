/*
  # Mise à jour des limites Pro à 10 membres

  1. Modifications
    - Mettre à jour les plans Pro (mensuel/annuel) à 10 membres max
    - Créer une fonction pour vérifier le plugin Pack Société
    - Mettre à jour check_team_member_limit pour inclure le plugin

  2. Logique
    - Starter: 0 membres
    - Pro Mensuel/Annuel: 10 membres (sans plugin)
    - Pro + Pack Société: illimité
*/

-- Mettre à jour les limites pour les plans Pro
UPDATE subscription_plans SET team_member_limit = 10 WHERE plan_id IN ('monthly', 'yearly');

-- Fonction pour vérifier si l'utilisateur a le plugin Pack Société actif
CREATE OR REPLACE FUNCTION has_pack_societe_plugin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_plugin boolean;
  plugin_id_var uuid;
BEGIN
  -- Récupérer l'ID du plugin Pack Société
  SELECT id INTO plugin_id_var
  FROM plugins
  WHERE slug = 'pack-societe'
  LIMIT 1;
  
  -- Si le plugin n'existe pas, retourner false
  IF plugin_id_var IS NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier si l'utilisateur a une souscription active au plugin
  SELECT EXISTS(
    SELECT 1
    FROM plugin_subscriptions
    WHERE user_id = user_id_param
      AND plugin_id = plugin_id_var
      AND status IN ('active', 'trial')
  ) INTO has_plugin;
  
  RETURN COALESCE(has_plugin, false);
END;
$$;

-- Mettre à jour la fonction check_team_member_limit pour inclure le plugin
CREATE OR REPLACE FUNCTION check_team_member_limit(owner_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plan_limit integer;
  current_count integer;
  has_plugin boolean;
  result jsonb;
BEGIN
  -- Vérifier si l'utilisateur a le plugin Pack Société
  has_plugin := has_pack_societe_plugin(owner_id_param);
  
  -- Si le plugin est actif, accès illimité
  IF has_plugin THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', NULL,
      'current', count_team_members(owner_id_param),
      'remaining', NULL,
      'has_plugin', true
    );
  END IF;
  
  -- Récupérer la limite du plan actuel de l'utilisateur
  SELECT sp.team_member_limit
  INTO current_plan_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = owner_id_param
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Si pas de plan actif, bloquer
  IF current_plan_limit IS NULL THEN
    current_plan_limit := 0;
  END IF;
  
  -- Compter les membres actuels
  current_count := count_team_members(owner_id_param);
  
  -- Construire la réponse
  result := jsonb_build_object(
    'allowed', current_count < current_plan_limit,
    'limit', current_plan_limit,
    'current', current_count,
    'remaining', GREATEST(0, current_plan_limit - current_count),
    'has_plugin', false
  );
  
  RETURN result;
END;
$$;
