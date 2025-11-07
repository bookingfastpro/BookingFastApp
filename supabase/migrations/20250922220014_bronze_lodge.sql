/*
  # Add deposit type settings

  1. New Columns
    - `deposit_type` (text) - Type d'acompte: 'percentage' ou 'fixed_amount'
    - `deposit_fixed_amount` (numeric) - Montant fixe par participant

  2. Changes
    - Ajout de colonnes pour gérer les acomptes en pourcentage ou montant fixe
    - Valeurs par défaut: percentage avec 30% et montant fixe de 20€
*/

-- Ajouter la colonne pour le type d'acompte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'deposit_type'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN deposit_type text DEFAULT 'percentage';
  END IF;
END $$;

-- Ajouter la colonne pour le montant fixe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'deposit_fixed_amount'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN deposit_fixed_amount numeric(10,2) DEFAULT 20.00;
  END IF;
END $$;

-- Ajouter une contrainte pour s'assurer que deposit_type a une valeur valide
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'business_settings_deposit_type_check'
  ) THEN
    ALTER TABLE business_settings 
    ADD CONSTRAINT business_settings_deposit_type_check 
    CHECK (deposit_type IN ('percentage', 'fixed_amount'));
  END IF;
END $$;
