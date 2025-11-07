-- 🔍 DIAGNOSTIC COMPLET RLS PAYMENT_LINKS

-- 1️⃣ Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'payment_links';

-- 2️⃣ Lister TOUTES les politiques
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  qual as "USING Clause",
  with_check as "WITH CHECK Clause"
FROM pg_policies
WHERE tablename = 'payment_links'
ORDER BY cmd, policyname;

-- 3️⃣ Vérifier les permissions de la table
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'payment_links'
  AND table_schema = 'public';

-- 4️⃣ Vérifier le rôle 'authenticated'
SELECT 
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin
FROM pg_roles
WHERE rolname = 'authenticated';

-- 5️⃣ Tester l'authentification actuelle
SELECT 
  auth.uid() as "Current User ID",
  auth.role() as "Current Role",
  current_user as "Database User";
