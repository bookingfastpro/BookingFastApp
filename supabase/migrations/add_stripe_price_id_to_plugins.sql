/*
  # Ajout du champ stripe_price_id aux plugins

  1. Modifications
    - Ajoute le champ `stripe_price_id` à la table `plugins`
    - Ce champ contiendra l'ID du Price Stripe pour chaque plugin
    
  2. Notes
    - Les Price IDs sont créés dans le dashboard Stripe
    - Format: price_xxxxx
*/

-- Ajouter le champ stripe_price_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugins' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE plugins ADD COLUMN stripe_price_id text;
  END IF;
END $$;

-- Mettre à jour les plugins existants avec des Price IDs de test
-- IMPORTANT: Remplacez ces IDs par vos vrais Price IDs Stripe
UPDATE plugins SET stripe_price_id = 'price_VOTRE_PRICE_ID_REPORTS' WHERE slug = 'reports';
UPDATE plugins SET stripe_price_id = 'price_VOTRE_PRICE_ID_VTC' WHERE slug = 'vtc';
UPDATE plugins SET stripe_price_id = 'price_VOTRE_PRICE_ID_MULTI_USER' WHERE slug = 'multi-user';
UPDATE plugins SET stripe_price_id = 'price_VOTRE_PRICE_ID_MARKETING' WHERE slug = 'marketing';
UPDATE plugins SET stripe_price_id = 'price_VOTRE_PRICE_ID_INVENTORY' WHERE slug = 'inventory';
