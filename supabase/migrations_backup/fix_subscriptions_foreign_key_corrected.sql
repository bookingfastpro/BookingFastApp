/*
  # Fix subscriptions foreign key

  1. Problème
    - La table subscriptions n'a pas de foreign key vers users
    - Les requêtes avec JOIN échouent avec PGRST200

  2. Solution
    - Ajouter la foreign key user_id -> users(id)
    - Ajouter l'index pour les performances
*/

-- Vérifier si la colonne user_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN user_id uuid;
    RAISE NOTICE '✅ Colonne user_id ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne user_id existe déjà';
  END IF;
END $$;

-- Supprimer la contrainte si elle existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey'
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;
    RAISE NOTICE '🔄 Ancienne contrainte supprimée';
  END IF;
END $$;

-- Ajouter la foreign key
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Créer l'index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Vérifier la contrainte
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey'
    AND table_name = 'subscriptions'
  ) INTO v_constraint_exists;
  
  IF v_constraint_exists THEN
    RAISE NOTICE '✅ VÉRIFICATION OK : Foreign key existe';
  ELSE
    RAISE WARNING '⚠️ VÉRIFICATION ÉCHOUÉE : Foreign key manquante !';
  END IF;
END $$;
