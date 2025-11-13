/*
  # Fix Subscription Trigger ON CONFLICT
  
  ## Problem
  - ON CONFLICT requires a unique constraint
  - subscriptions table doesn't have unique constraint on (user_id, plan_id)
  
  ## Solution
  - Remove ON CONFLICT clause
  - Check if subscription exists before inserting
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  free_plan_id uuid;
  subscription_exists boolean;
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Récupérer l'ID du plan Free
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE name = 'Free'
  LIMIT 1;
  
  -- Vérifier si un abonnement existe déjà
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE user_id = NEW.id
  ) INTO subscription_exists;
  
  -- Créer un abonnement Free avec 30 jours de trial seulement s'il n'existe pas
  IF free_plan_id IS NOT NULL AND NOT subscription_exists THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      trial_end,
      cancel_at_period_end
    )
    VALUES (
      NEW.id,
      free_plan_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year',
      NOW() + INTERVAL '30 days',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
