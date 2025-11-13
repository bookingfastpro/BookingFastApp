/*
  # Ajout de la colonne commission_rate à la table affiliates

  1. Modifications
    - Ajout de la colonne `commission_rate` (taux de commission en pourcentage)
    - Valeur par défaut de 20% (modifiable)
    - Contrainte pour s'assurer que le taux est entre 0 et 100

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Ajouter la colonne commission_rate si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE affiliates 
    ADD COLUMN commission_rate numeric(5,2) NOT NULL DEFAULT 20.00
    CHECK (commission_rate >= 0 AND commission_rate <= 100);
  END IF;
END $$;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN affiliates.commission_rate IS 'Taux de commission en pourcentage (0-100)';
