/*
  # Ajouter la contrainte de clé étrangère vers users

  1. Contrainte de clé étrangère
    - Ajoute la relation entre `account_users.user_id` et `users.id`
    - Permet les jointures PostgREST
    - Cascade sur suppression pour maintenir l'intégrité

  2. Sécurité
    - Maintient l'intégrité référentielle
    - Suppression en cascade des relations
*/

-- Ajouter la contrainte de clé étrangère si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'account_users_user_id_fkey' 
    AND table_name = 'account_users'
  ) THEN
    ALTER TABLE public.account_users 
    ADD CONSTRAINT account_users_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;
