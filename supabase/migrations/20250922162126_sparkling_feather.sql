/*
  # Ajout de la clé étrangère manquante pour code_redemptions

  1. Modifications
    - Ajouter la contrainte de clé étrangère entre `code_redemptions.user_id` et `users.id`
    - Vérification conditionnelle pour éviter les erreurs si la contrainte existe déjà

  2. Sécurité
    - Utilisation de `ON DELETE CASCADE` pour maintenir l'intégrité référentielle
    - Vérification de l'existence avant création
*/

-- Ajouter la clé étrangère manquante entre code_redemptions et users
DO $$
BEGIN
  -- Vérifier si la contrainte n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'code_redemptions_user_id_fkey' 
    AND table_name = 'code_redemptions'
  ) THEN
    ALTER TABLE code_redemptions 
    ADD CONSTRAINT code_redemptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;
