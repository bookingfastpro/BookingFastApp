/*
  # Ajout du taux de TVA aux paramètres

  1. Modifications
    - Ajoute la colonne `tax_rate` à la table `business_settings`
    - Définit une valeur par défaut de 20% (TVA standard en France)
    - Permet des valeurs décimales pour supporter différents taux (5.5%, 10%, 20%, etc.)

  2. Notes
    - Le taux est stocké en pourcentage (ex: 20 pour 20%)
    - Les services existants conservent leurs prix actuels
    - Le calcul HT se fera automatiquement côté application
*/

-- Ajouter la colonne tax_rate si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_settings' 
    AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE business_settings 
    ADD COLUMN tax_rate numeric(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100);
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN business_settings.tax_rate IS 'Taux de TVA/taxe en pourcentage (ex: 20.00 pour 20%)';
  END IF;
END $$;

-- Mettre à jour les paramètres existants avec le taux par défaut
UPDATE business_settings 
SET tax_rate = 20.00 
WHERE tax_rate IS NULL;
