/*
  # Ajout des limites de membres d'équipe

  1. Modifications
    - Ajouter `team_member_limit` à subscription_plans
    - Créer une fonction pour compter les membres actifs
    - Créer une fonction pour vérifier la limite avant invitation

  2. Sécurité
    - Fonction accessible aux utilisateurs authentifiés
*/

-- Ajouter la colonne team_member_limit à subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS team_member_limit integer;

-- Mettre à jour les limites pour chaque plan
UPDATE subscription_plans SET team_member_limit = 0 WHERE plan_id = 'starter';
UPDATE subscription_plans SET team_member_limit = NULL WHERE plan_id IN ('monthly', 'yearly'); -- NULL = illimité

-- Fonction pour compter les membres d'équipe actifs
CREATE OR REPLACE FUNCTION count_team_members(owner_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_count integer;
BEGIN
  SELECT COUNT(*)
  INTO member_count
  FROM team_members
  WHERE owner_id = owner_id_param
    AND is_active = true;
  
  RETURN COALESCE(member_count, 0);
END;
$$;

-- Fonction pour vérifier si l'utilisateur peut inviter un membre
CREATE OR REPLACE FUNCTION check_team_member_limit(owner_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plan_limit integer;
  current_count integer;
  result jsonb;
BEGIN
  -- Récupérer la limite du plan actuel de l'utilisateur
  SELECT sp.team_member_limit
  INTO current_plan_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = owner_id_param
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Si pas de limite (NULL = illimité), autoriser
  IF current_plan_limit IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'limit', NULL,
      'current', 0,
      'remaining', NULL
    );
  END IF;
  
  -- Compter les membres actuels
  current_count := count_team_members(owner_id_param);
  
  -- Construire la réponse
  result := jsonb_build_object(
    'allowed', current_count < current_plan_limit,
    'limit', current_plan_limit,
    'current', current_count,
    'remaining', GREATEST(0, current_plan_limit - current_count)
  );
  
  RETURN result;
END;
$$;

-- Créer un index pour optimiser les requêtes de comptage
CREATE INDEX IF NOT EXISTS idx_team_members_owner_active 
ON team_members(owner_id, is_active);
