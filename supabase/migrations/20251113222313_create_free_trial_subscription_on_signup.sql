/*
  # Create Free Trial Subscription on Signup
  
  ## Problem
  - New users don't get any subscription automatically
  - Users need a Free plan to start using the app
  
  ## Solution
  - Update handle_new_user() function to create Free subscription
  - Give 30 days trial period
*/

-- Mettre à jour la fonction pour créer automatiquement un abonnement Free
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  free_plan_id uuid;
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
  
  -- Créer un abonnement Free avec 30 jours de trial
  IF free_plan_id IS NOT NULL THEN
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
    )
    ON CONFLICT (user_id, plan_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
