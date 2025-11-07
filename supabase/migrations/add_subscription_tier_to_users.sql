/*
  # Ajout de la colonne subscription_tier à la table users

  1. Modifications
    - Ajout de la colonne `subscription_tier` (text) avec valeur par défaut 'trial'
    - Valeurs possibles : 'trial', 'starter', 'pro'
    - Index ajouté pour optimiser les requêtes

  2. Notes
    - Les utilisateurs existants auront automatiquement 'trial' comme valeur
    - Cette colonne permet de différencier les plans d'abonnement
*/

-- Ajouter la colonne subscription_tier si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'trial';
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN users.subscription_tier IS 'Tier d''abonnement: trial, starter, pro';
    
    -- Créer un index pour optimiser les requêtes
    CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
    
    -- Ajouter une contrainte pour valider les valeurs
    ALTER TABLE users ADD CONSTRAINT check_subscription_tier 
      CHECK (subscription_tier IN ('trial', 'starter', 'pro'));
  END IF;
END $$;
