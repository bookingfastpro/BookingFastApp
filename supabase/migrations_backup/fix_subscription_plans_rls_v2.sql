/*
  # Fix RLS permissions pour subscription_plans - V2
  
  1. Problème
    - Error 42501: permission denied for table subscription_plans
    - Les policies existent mais ne fonctionnent pas
  
  2. Solution
    - Supprimer TOUTES les policies existantes
    - Recréer les policies correctement
    - Ajouter une policy spécifique pour service_role
*/

-- 1. Supprimer TOUTES les policies existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscription_plans') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON subscription_plans';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 2. S'assurer que RLS est activé
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 3. Policy pour lecture publique des plans actifs
CREATE POLICY "public_read_active_plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- 4. Policy pour que service_role puisse TOUT lire
CREATE POLICY "service_role_read_all"
  ON subscription_plans
  FOR SELECT
  TO service_role
  USING (true);

-- 5. Policy pour que les admins puissent gérer les plans
CREATE POLICY "authenticated_manage_plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. GRANT les permissions de base
GRANT SELECT ON subscription_plans TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON subscription_plans TO authenticated, service_role;

-- 7. Vérification finale
DO $$
DECLARE
  plan_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'subscription_plans';
  
  RAISE NOTICE '✅ Permissions restaurées sur subscription_plans !';
  RAISE NOTICE '📊 Plans actifs trouvés: %', plan_count;
  RAISE NOTICE '🔒 Policies créées: %', policy_count;
  
  IF plan_count = 0 THEN
    RAISE WARNING '⚠️ Aucun plan actif trouvé !';
  END IF;
END $$;
