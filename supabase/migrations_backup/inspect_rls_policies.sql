/*
  # Inspection des Politiques RLS sur la table bookings
  
  Cette requête récupère le code source EXACT de toutes les politiques RLS
  appliquées à la table bookings pour identifier l'utilisation de substring.
*/

-- Récupérer toutes les politiques RLS sur la table bookings
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;

-- Récupérer les définitions complètes des politiques
SELECT 
  pol.polname AS policy_name,
  pol.polcmd AS command,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command_type,
  pg_get_expr(pol.polqual, pol.polrelid) AS using_clause,
  pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_clause,
  pol.polroles::regrole[] AS roles
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pc.relname = 'bookings'
  AND pn.nspname = 'public'
ORDER BY pol.polname;
