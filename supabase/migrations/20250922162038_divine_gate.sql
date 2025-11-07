/*
  # Ajout des clés étrangères manquantes

  1. Clés étrangères
    - Ajouter la clé étrangère user_id dans user_subscriptions vers users(id)
    - S'assurer que la clé étrangère plan_id existe dans user_subscriptions vers subscription_plans(id)

  2. Sécurité
    - Vérifier que les contraintes n'existent pas déjà avant de les créer
*/

-- Ajouter la clé étrangère user_id dans user_subscriptions vers users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_subscriptions_user_id_fkey'
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Vérifier et ajouter la clé étrangère plan_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_subscriptions_plan_id_fkey'
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;
  END IF;
END $$;
