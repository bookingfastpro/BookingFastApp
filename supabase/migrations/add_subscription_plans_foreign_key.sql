/*
  # Ajouter la foreign key vers subscription_plans

  1. Problème
    - La table subscriptions n'a pas de foreign key vers subscription_plans
    - Les requêtes avec JOIN échouent avec PGRST200

  2. Solution
    - Ajouter la colonne plan_id si elle n'existe pas
    - Ajouter la foreign key plan_id -> subscription_plans(id)
    - Ajouter l'index pour les performances
*/

-- Vérifier si la colonne plan_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id uuid;
    RAISE NOTICE '✅ Colonne plan_id ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne plan_id existe déjà';
  END IF;
END $$;

-- Supprimer la contrainte si elle existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_plan_id_fkey'
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_id_fkey;
    RAISE NOTICE '🔄 Ancienne contrainte supprimée';
  END IF;
END $$;

-- Ajouter la foreign key
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id)
  REFERENCES subscription_plans(id)
  ON DELETE SET NULL;

-- Créer l'index
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- Vérifier la contrainte
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_plan_id_fkey'
    AND table_name = 'subscriptions'
  ) INTO v_constraint_exists;
  
  IF v_constraint_exists THEN
    RAISE NOTICE '✅ VÉRIFICATION OK : Foreign key vers subscription_plans existe';
  ELSE
    RAISE WARNING '⚠️ VÉRIFICATION ÉCHOUÉE : Foreign key manquante !';
  END IF;
END $$;

-- Afficher un résumé des foreign keys
DO $$
DECLARE
  v_user_fk BOOLEAN;
  v_plan_fk BOOLEAN;
BEGIN
  -- Vérifier foreign key vers users
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey'
    AND table_name = 'subscriptions'
  ) INTO v_user_fk;
  
  -- Vérifier foreign key vers subscription_plans
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_plan_id_fkey'
    AND table_name = 'subscriptions'
  ) INTO v_plan_fk;
  
  RAISE NOTICE '📊 RÉSUMÉ DES FOREIGN KEYS :';
  RAISE NOTICE '   - subscriptions → users : %', CASE WHEN v_user_fk THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   - subscriptions → subscription_plans : %', CASE WHEN v_plan_fk THEN '✅' ELSE '❌' END;
END $$;
