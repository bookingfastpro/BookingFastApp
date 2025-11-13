/*
  # Ajout des limites de réservations mensuelles

  1. Modifications
    - Ajouter `booking_limit` à subscription_plans
    - Créer une fonction pour compter les réservations du mois
    - Créer une fonction pour vérifier la limite avant création

  2. Sécurité
    - Fonction accessible aux utilisateurs authentifiés
*/

-- Ajouter la colonne booking_limit à subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS booking_limit integer;

-- Mettre à jour les limites pour chaque plan
UPDATE subscription_plans SET booking_limit = 100 WHERE plan_id = 'starter';
UPDATE subscription_plans SET booking_limit = NULL WHERE plan_id IN ('monthly', 'yearly'); -- NULL = illimité

-- Fonction pour compter les réservations du mois en cours
CREATE OR REPLACE FUNCTION count_monthly_bookings(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_count integer;
BEGIN
  SELECT COUNT(*)
  INTO booking_count
  FROM bookings
  WHERE user_id = user_id_param
    AND date >= date_trunc('month', CURRENT_DATE)
    AND date < date_trunc('month', CURRENT_DATE) + interval '1 month'
    AND booking_status != 'cancelled';
  
  RETURN COALESCE(booking_count, 0);
END;
$$;

-- Fonction pour vérifier si l'utilisateur peut créer une réservation
CREATE OR REPLACE FUNCTION check_booking_limit(user_id_param uuid)
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
  SELECT sp.booking_limit
  INTO current_plan_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.plan_id
  WHERE us.user_id = user_id_param
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
  
  -- Compter les réservations du mois
  current_count := count_monthly_bookings(user_id_param);
  
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
CREATE INDEX IF NOT EXISTS idx_bookings_user_date_status 
ON bookings(user_id, date, booking_status);
