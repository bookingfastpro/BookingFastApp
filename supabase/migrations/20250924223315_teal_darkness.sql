/*
  # Ajouter les colonnes account_id manquantes

  1. Colonnes ajoutées
    - `business_settings.account_id` (UUID, foreign key vers accounts)
    - Mise à jour des données existantes avec l'account_id du propriétaire

  2. Index et contraintes
    - Index sur account_id pour les performances
    - Contraintes de clé étrangère

  3. Mise à jour des données
    - Backfill des account_id existants basés sur user_id
*/

-- Ajouter account_id à business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN account_id uuid;
    
    -- Backfill account_id basé sur user_id
    UPDATE business_settings 
    SET account_id = (
      SELECT id FROM accounts WHERE owner_id = business_settings.user_id LIMIT 1
    );
    
    -- Rendre la colonne NOT NULL après le backfill
    ALTER TABLE business_settings ALTER COLUMN account_id SET NOT NULL;
    
    -- Ajouter la contrainte de clé étrangère
    ALTER TABLE business_settings 
    ADD CONSTRAINT business_settings_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
    
    -- Ajouter un index pour les performances
    CREATE INDEX idx_business_settings_account_id ON business_settings(account_id);
  END IF;
END $$;

-- Note: Les autres tables (bookings, services) utilisent déjà user_id
-- et peuvent être filtrées via les relations avec accounts
-- account_users existe déjà avec account_id
