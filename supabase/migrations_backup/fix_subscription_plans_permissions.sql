/*
  # Fix permissions sur subscription_plans
  
  La table subscription_plans retourne 403 car elle n'a pas les bonnes permissions.
  On doit permettre à tout le monde de LIRE les plans (pour l'affichage public).
*/

-- 1. Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plans') THEN
    RAISE EXCEPTION 'Table subscription_plans n''existe pas !';
  END IF;
END $$;

-- 2. Activer RLS si pas déjà fait
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can manage plans" ON subscription_plans;

-- 4. Créer une policy SIMPLE pour la lecture publique
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- 5. Policy pour les admins (authenticated)
CREATE POLICY "Authenticated users can manage plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. GRANT les permissions de base
GRANT SELECT ON subscription_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;

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
