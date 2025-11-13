/*
  # Grant super admin to first user

  1. Security
    - Grant super admin status to the first user in the system
    - This allows the first user to manage other users and permissions
  
  2. Changes
    - Update the first user to have is_super_admin = true
    - Only affects the first user by creation date
*/

-- Accorder le statut super admin au premier utilisateur
UPDATE users 
SET is_super_admin = true, updated_at = now()
WHERE id = (
  SELECT id 
  FROM users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Vérifier que l'opération a réussi
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE is_super_admin = true) THEN
    RAISE NOTICE 'Super admin accordé avec succès au premier utilisateur';
  ELSE
    RAISE NOTICE 'Aucun utilisateur trouvé pour accorder le statut super admin';
  END IF;
END $$;
