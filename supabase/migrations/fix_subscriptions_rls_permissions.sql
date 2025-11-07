/*
  # Fix RLS permissions pour subscriptions
  
  1. Problème
    - Error 42501: permission denied for table subscriptions
    - RLS bloque l'accès même pour les utilisateurs authentifiés
  
  2. Solution
    - Activer RLS sur subscriptions
    - Créer des policies pour permettre l'accès aux admins
    - Créer des policies pour permettre aux users de voir leurs propres subscriptions
*/

-- 1. Activer RLS sur subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;

-- 3. Policy pour que les users voient leurs propres subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Policy pour que les admins voient TOUTES les subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- 5. Policy pour que les admins puissent gérer toutes les subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- 6. GRANT les permissions de base
GRANT SELECT ON subscriptions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON subscriptions TO authenticated;

-- 7. Vérifier les policies
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'subscriptions';
  
  RAISE NOTICE '✅ Policies créées sur subscriptions: %', v_policy_count;
  
  IF v_policy_count < 3 THEN
    RAISE WARNING '⚠️ Nombre de policies insuffisant !';
  END IF;
END $$;

-- 8. Afficher les policies créées
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  RAISE NOTICE '📋 POLICIES SUR SUBSCRIPTIONS :';
  FOR v_policy IN 
    SELECT policyname, cmd, qual::text
    FROM pg_policies
    WHERE tablename = 'subscriptions'
  LOOP
    RAISE NOTICE '   - % (%) : %', v_policy.policyname, v_policy.cmd, LEFT(v_policy.qual, 50);
  END LOOP;
END $$;
