/*
  # Ajouter la clé étrangère manquante pour code_redemptions

  1. Contraintes
    - Ajouter la clé étrangère `code_redemptions.user_id` → `users.id`
    - Ajouter l'index pour les performances

  2. Sécurité
    - Vérifier l'existence avant d'ajouter
    - Éviter les erreurs de doublon
*/

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'code_redemptions_user_id_fkey' 
    AND table_name = 'code_redemptions'
  ) THEN
    ALTER TABLE code_redemptions 
    ADD CONSTRAINT code_redemptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Clé étrangère code_redemptions_user_id_fkey ajoutée';
  ELSE
    RAISE NOTICE 'Clé étrangère code_redemptions_user_id_fkey existe déjà';
  END IF;
END $$;

-- Ajouter l'index si il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_code_redemptions_user_id_fkey'
  ) THEN
    CREATE INDEX idx_code_redemptions_user_id_fkey ON code_redemptions(user_id);
    RAISE NOTICE 'Index idx_code_redemptions_user_id_fkey ajouté';
  ELSE
    RAISE NOTICE 'Index idx_code_redemptions_user_id_fkey existe déjà';
  END IF;
END $$;
