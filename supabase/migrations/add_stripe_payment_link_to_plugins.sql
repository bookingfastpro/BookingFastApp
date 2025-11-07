/*
  # Ajout du champ stripe_payment_link aux plugins

  1. Modifications
    - Ajoute le champ `stripe_payment_link` à la table `plugins`
    - Ce champ contiendra l'URL du Payment Link Stripe pour chaque plugin
    
  2. Notes
    - Les Payment Links sont créés manuellement dans le dashboard Stripe
    - Ils permettent d'éviter les Edge Functions qui sont instables
    - Format: https://buy.stripe.com/xxxxx
*/

-- Ajouter le champ stripe_payment_link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugins' AND column_name = 'stripe_payment_link'
  ) THEN
    ALTER TABLE plugins ADD COLUMN stripe_payment_link text;
  END IF;
END $$;

-- Mettre à jour les plugins existants avec des Payment Links de test
-- IMPORTANT: Remplacez ces URLs par vos vrais Payment Links Stripe
UPDATE plugins SET stripe_payment_link = 'https://buy.stripe.com/test_VOTRE_LINK_REPORTS' WHERE slug = 'reports';
UPDATE plugins SET stripe_payment_link = 'https://buy.stripe.com/test_VOTRE_LINK_VTC' WHERE slug = 'vtc';
UPDATE plugins SET stripe_payment_link = 'https://buy.stripe.com/test_VOTRE_LINK_MULTI_USER' WHERE slug = 'multi-user';
UPDATE plugins SET stripe_payment_link = 'https://buy.stripe.com/test_VOTRE_LINK_MARKETING' WHERE slug = 'marketing';
UPDATE plugins SET stripe_payment_link = 'https://buy.stripe.com/test_VOTRE_LINK_INVENTORY' WHERE slug = 'inventory';
