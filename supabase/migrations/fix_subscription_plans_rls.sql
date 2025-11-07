/*
  # Fix RLS permissions pour subscription_plans
  
  1. Problème
    - Error 42501: permission denied for table subscription_plans
    - La table bloque l'accès même avec service_role_key
  
  2. Solution
    - Activer RLS sur subscription_plans
    - Créer une policy pour permettre la lecture publique des plans actifs
    - Créer une policy pour permettre la gestion par les admins
*/

-- 1. Activer RLS sur subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Service role can read all plans" ON subscription_plans;

-- 3. Policy pour lecture publique des plans actifs
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- 4. Policy pour que service_role puisse TOUT lire (même les plans inactifs)
CREATE POLICY "Service role can read all plans"
  ON subscription_plans
  FOR SELECT
  TO service_role
  USING (true);

-- 5. Policy pour que les admins puissent gérer les plans
CREATE POLICY "Authenticated users can manage plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. GRANT les permissions de base
GRANT SELECT ON subscription_plans TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON subscription_plans TO authenticated, service_role;

-- 7. Vérification
DO $$
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;
  RAISE NOTICE '✅ Permissions restaurées sur subscription_plans !';
  RAISE NOTICE '📊 Plans actifs trouvés: %', plan_count;
  
  IF plan_count = 0 THEN
    RAISE WARNING '⚠️ Aucun plan actif trouvé ! Vérifie les données.';
  END IF;
END $$;
