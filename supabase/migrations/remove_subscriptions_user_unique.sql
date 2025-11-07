/*
  # Supprimer la contrainte unique sur subscriptions.user_id
  
  1. Problème
    - Error 23505: duplicate key value violates unique constraint "subscriptions_user_id_key"
    - La contrainte unique empêche un utilisateur d'avoir plusieurs abonnements
  
  2. Solution
    - Supprimer la contrainte unique sur user_id
    - Permettre plusieurs abonnements par utilisateur (historique, changements de plan, etc.)
    - Garder l'index pour les performances
  
  3. Business Logic
    - Un utilisateur peut avoir plusieurs abonnements dans l'historique
    - Seul l'abonnement avec status='active' est considéré comme actif
    - Les anciens abonnements gardent status='cancelled' ou 'expired'
*/

-- 1. Supprimer la contrainte unique sur user_id
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

-- 5. Afficher les index restants
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
