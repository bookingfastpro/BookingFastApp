-- 🔍 Vérifier la structure de la table payment_links
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payment_links'
ORDER BY ordinal_position;

-- 🔍 Vérifier les contraintes
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payment_links'::regclass;

-- 🔍 Vérifier les politiques RLS en détail
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payment_links';
