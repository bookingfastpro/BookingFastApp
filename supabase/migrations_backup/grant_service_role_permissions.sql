/*
  # Permissions PostgreSQL pour service_role

  1. Modifications
    - GRANT ALL sur bookings pour service_role
    - GRANT ALL sur users pour service_role
    - GRANT sur les séquences

  2. Sécurité
    - service_role a accès complet (utilisé par Edge Functions)
*/

-- Donner tous les droits au service_role sur bookings
GRANT ALL ON TABLE bookings TO service_role;

-- Donner tous les droits au service_role sur users
GRANT ALL ON TABLE users TO service_role;

-- Donner les droits sur les séquences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Vérifier les permissions
SELECT 
  schemaname,
  tablename,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'SELECT') as can_select,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'INSERT') as can_insert,
  has_table_privilege('service_role', schemaname || '.' || tablename, 'UPDATE') as can_update
FROM pg_tables
WHERE tablename IN ('bookings', 'users');
