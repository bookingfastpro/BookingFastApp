/*
  # Grant Permissions sur invoice_payments
  
  1. Donner tous les droits à authenticated
  2. Donner droits sur les séquences
*/

-- 1. Grant ALL sur la table invoice_payments
GRANT ALL ON TABLE invoice_payments TO authenticated;

-- 2. Grant sur les séquences (pour les ID auto)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Vérifier les permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='invoice_payments';
