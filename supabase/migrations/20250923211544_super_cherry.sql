/*
  # Add payment link expiry setting

  1. New Column
    - `payment_link_expiry_minutes` (integer, default 30)
      - Durée d'expiration des liens de paiement en minutes
      - Valeur par défaut : 30 minutes
      - Minimum : 5 minutes
      - Maximum : 1440 minutes (24 heures)

  2. Constraints
    - Vérification que la valeur est entre 5 et 1440 minutes

  3. Index
    - Index sur la nouvelle colonne pour les requêtes
*/

-- Ajouter la colonne pour le délai d'expiration des liens de paiement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'payment_link_expiry_minutes'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN payment_link_expiry_minutes integer DEFAULT 30;
  END IF;
END $$;

-- Ajouter une contrainte pour valider la plage de valeurs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'business_settings_payment_link_expiry_check'
  ) THEN
    ALTER TABLE business_settings 
    ADD CONSTRAINT business_settings_payment_link_expiry_check 
    CHECK (payment_link_expiry_minutes >= 5 AND payment_link_expiry_minutes <= 1440);
  END IF;
END $$;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_business_settings_payment_link_expiry 
ON business_settings (payment_link_expiry_minutes);

-- Mettre à jour les enregistrements existants avec la valeur par défaut
UPDATE business_settings 
SET payment_link_expiry_minutes = 30 
WHERE payment_link_expiry_minutes IS NULL;
