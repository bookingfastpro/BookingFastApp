/*
  # Ajouter contrainte unique sur subscriptions.user_id
  
  Pour permettre ON CONFLICT dans le trigger
*/

-- Supprimer l'ancienne contrainte si elle existe
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

-- Ajouter la contrainte unique
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
