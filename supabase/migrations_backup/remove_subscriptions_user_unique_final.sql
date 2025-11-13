/*
  # Supprimer la contrainte unique sur subscriptions.user_id
  
  1. Problème
    - Contrainte subscriptions_user_id_key empêche plusieurs abonnements par utilisateur
    - Error 23505: duplicate key value violates unique constraint
  
  2. Solution
    - Supprimer la contrainte unique sur user_id
    - Garder l'index pour les performances
    - Permettre plusieurs abonnements par utilisateur
  
  3. Vérification
    - Confirmer que la contrainte est bien supprimée
    - Afficher les index restants
*/

-- 1. Supprimer la contrainte unique sur subscriptions.user_id
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

-- 2. Garder l'index pour les performances (sans contrainte unique)
DROP INDEX IF EXISTS idx_subscriptions_user_id;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- 3. Créer un index composite pour trouver rapidement l'abonnement actif
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- 4. Vérifier que la contrainte a bien été supprimée
DO $$
DECLARE
  v_constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_key'
  ) INTO v_constraint_exists;
  
  IF v_constraint_exists THEN
    RAISE WARNING '⚠️ La contrainte unique existe encore !';
  ELSE
    RAISE NOTICE '✅ Contrainte unique supprimée avec succès';
  END IF;
END $$;

-- 5. Afficher les contraintes restantes sur subscriptions
DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  RAISE NOTICE '📋 CONTRAINTES SUR SUBSCRIPTIONS :';
  FOR v_constraint IN 
    SELECT conname, contype
    FROM pg_constraint
    WHERE conrelid = 'subscriptions'::regclass
  LOOP
    RAISE NOTICE '   - % (type: %)', v_constraint.conname, v_constraint.contype;
  END LOOP;
END $$;

-- 6. Afficher les index restants
DO $$
DECLARE
  v_index RECORD;
BEGIN
  RAISE NOTICE '📋 INDEX SUR SUBSCRIPTIONS :';
  FOR v_index IN 
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'subscriptions'
  LOOP
    RAISE NOTICE '   - %', v_index.indexname;
  END LOOP;
END $$;
