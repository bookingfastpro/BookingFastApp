/*
  # Add Foreign Keys to Subscriptions Table

  1. Problem
    - PGRST200 error: No foreign key relationship found between subscriptions and plans
    - Supabase PostgREST requires explicit FK for JOIN queries

  2. Solution
    - Add foreign key: subscriptions.user_id → users.id
    - Add foreign key: subscriptions.plan_id → plans.id
    - Add indexes for performance
*/

-- ✅ 1. Foreign Key vers users
DO $$
BEGIN
  -- Vérifier si la colonne user_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN user_id uuid;
    RAISE NOTICE '✅ Colonne user_id ajoutée';
  END IF;

  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey'
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;
    RAISE NOTICE '🔄 Ancienne contrainte user_id supprimée';
  END IF;
END $$;

-- Ajouter la foreign key vers users
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

RAISE NOTICE '✅ Foreign key ajoutée: subscriptions.user_id → users.id';

-- ✅ 2. Foreign Key vers plans
DO $$
BEGIN
  -- Vérifier si la colonne plan_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id text;
    RAISE NOTICE '✅ Colonne plan_id ajoutée';
  END IF;

  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_plan_id_fkey'
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_id_fkey;
    RAISE NOTICE '🔄 Ancienne contrainte plan_id supprimée';
  END IF;
END $$;

-- Ajouter la foreign key vers plans
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_id_fkey
  FOREIGN KEY (plan_id)
  REFERENCES plans(plan_id)
  ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

RAISE NOTICE '✅ Foreign key ajoutée: subscriptions.plan_id → plans.plan_id';

-- ✅ 3. Vérification finale
DO $$
DECLARE
  v_user_fk BOOLEAN;
  v_plan_fk BOOLEAN;
BEGIN
  -- Vérifier FK vers users
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey'
    AND table_name = 'subscriptions'
  ) INTO v_user_fk;
  
  -- Vérifier FK vers plans
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_plan_id_fkey'
    AND table_name = 'subscriptions'
  ) INTO v_plan_fk;
  
  RAISE NOTICE '📊 RÉSUMÉ DES FOREIGN KEYS :';
  RAISE NOTICE '   - subscriptions → users : %', CASE WHEN v_user_fk THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   - subscriptions → plans : %', CASE WHEN v_plan_fk THEN '✅' ELSE '❌' END;
  
  IF v_user_fk AND v_plan_fk THEN
    RAISE NOTICE '🎉 TOUTES LES FOREIGN KEYS SONT EN PLACE !';
  ELSE
    RAISE WARNING '⚠️ CERTAINES FOREIGN KEYS SONT MANQUANTES !';
  END IF;
END $$;
