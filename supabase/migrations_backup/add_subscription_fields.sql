-- Ajouter les champs manquants pour la gestion des abonnements

-- Ajouter current_period_end si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'current_period_end'
  ) THEN
    ALTER TABLE users ADD COLUMN current_period_end timestamptz;
  END IF;
END $$;

-- Ajouter cancel_at_period_end si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE users ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter stripe_subscription_id si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Ajouter stripe_customer_id si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Créer un index sur stripe_subscription_id pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
