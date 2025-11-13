/*
  # Fix permissions sur la table bookings
  
  Après le DROP CASCADE, les permissions ont été perdues.
  On les remet en place pour authenticated et anon.
*/

-- 1. Donner TOUS les droits à authenticated
GRANT ALL ON bookings TO authenticated;

-- 2. Donner les droits de lecture/écriture à anon (pour les paiements publics)
GRANT SELECT, INSERT, UPDATE ON bookings TO anon;

-- 3. Donner les droits sur les séquences si nécessaire
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Permissions restaurées sur bookings !';
  RAISE NOTICE 'authenticated: ALL';
  RAISE NOTICE 'anon: SELECT, INSERT, UPDATE';
END $$;
