/*
  # Fix permissions et données plugin_subscriptions
  
  1. Vérifier la structure de la table
  2. Ajouter les bonnes permissions RLS
  3. Vérifier les données existantes
*/

-- 1. Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plugin_subscriptions') THEN
    RAISE EXCEPTION 'Table plugin_subscriptions n''existe pas !';
  END IF;
END $$;

-- 2. Activer RLS
ALTER TABLE plugin_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view own plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can insert own plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can update own plugin subscriptions" ON plugin_subscriptions;

-- 4. Créer les policies correctes
CREATE POLICY "Users can view own plugin subscriptions"
  ON plugin_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plugin subscriptions"
  ON plugin_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plugin subscriptions"
  ON plugin_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. GRANT permissions
GRANT SELECT, INSERT, UPDATE ON plugin_subscriptions TO authenticated;

-- 6. Vérification des données pour l'utilisateur
DO $$
DECLARE
  user_id_to_check uuid := '90c1d12b-4f6b-4941-a254-7fef8acb44a5';
  sub_count INTEGER;
  plugin_count INTEGER;
BEGIN
  -- Compter les abonnements
  SELECT COUNT(*) INTO sub_count 
  FROM plugin_subscriptions 
  WHERE user_id = user_id_to_check;
  
  -- Compter les plugins disponibles
  SELECT COUNT(*) INTO plugin_count 
  FROM plugins 
  WHERE is_active = true;
  
  RAISE NOTICE '📊 Statistiques pour user %:', user_id_to_check;
  RAISE NOTICE '   -
