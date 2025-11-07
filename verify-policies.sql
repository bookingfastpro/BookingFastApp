-- 🔍 Vérifier toutes les politiques RLS sur payment_links
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payment_links'
ORDER BY policyname;

-- 🔍 Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'payment_links';
