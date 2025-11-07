/*
  # Ajout du prix TTC pour les produits POS

  1. Modifications
    - Ajouter la colonne `is_ttc_price` à la table `pos_products`
    - Par défaut, les produits existants seront en HT (false)
    - Les nouveaux produits pourront choisir TTC ou HT

  2. Notes
    - Cette migration est compatible avec les données existantes
    - Les produits existants restent en mode HT par défaut
*/

-- Ajouter la colonne is_ttc_price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pos_products' AND column_name = 'is_ttc_price'
  ) THEN
    ALTER TABLE pos_products ADD COLUMN is_ttc_price boolean DEFAULT false;
  END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pos_products_is_ttc_price ON pos_products(is_ttc_price);
