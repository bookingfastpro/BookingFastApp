/*
  # Permissions PostgreSQL pour les tables plugins

  1. Modifications
    - GRANT ALL sur plugins pour authenticated et anon
    - GRANT ALL sur plugin_subscriptions pour authenticated et anon
    - GRANT ALL sur plugin_configurations pour authenticated et anon
    - GRANT USAGE sur les séquences

  2. Sécurité
    - Accès complet aux tables pour les utilisateurs authentifiés
    - Accès lecture pour les utilisateurs anonymes (marketplace public)
*/

-- Donner tous les droits sur la table plugins
GRANT ALL ON TABLE plugins TO authenticated;
GRANT SELECT ON TABLE plugins TO anon;

-- Donner tous les droits sur la table plugin_subscriptions
GRANT ALL ON TABLE plugin_subscriptions TO authenticated;
GRANT SELECT ON TABLE plugin_subscriptions TO anon;

-- Donner tous les droits sur la table plugin_configurations
GRANT ALL ON TABLE plugin_configurations TO authenticated;
GRANT SELECT ON TABLE plugin_configurations TO anon;

-- Donner les droits sur les séquences si elles existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'plugins_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE plugins_id_seq TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'plugin_subscriptions_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE plugin_subscriptions_id_seq TO authenticated;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'plugin_configurations_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE plugin_configurations_id_seq TO authenticated;
  END IF;
END $$;

-- Vérifier les permissions (pour debug)
SELECT 
  schemaname,
  tablename,
  tableowner,
  has_table_privilege('authenticated', schemaname || '.' || tablename, 'SELECT') as can_select,
  has_table_privilege('authenticated', schemaname || '.' || tablename, 'INSERT') as can_insert,
  has_table_privilege('authenticated', schemaname || '.' || tablename, 'UPDATE') as can_update,
  has_table_privilege('authenticated', schemaname || '.' || tablename, 'DELETE') as can_delete
FROM pg_tables
WHERE tablename IN ('plugins', 'plugin_subscriptions', 'plugin_configurations');
