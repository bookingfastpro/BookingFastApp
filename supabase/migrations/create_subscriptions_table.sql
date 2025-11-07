/*
  # Création de la table subscriptions

  1. Nouvelle Table
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `status` (text) - Statut de l'abonnement (trial, active, cancelled, expired)
      - `is_trial` (boolean) - Indique si c'est une période d'essai
      - `trial_ends_at` (timestamptz) - Date de fin de l'essai
      - `stripe_subscription_id` (text) - ID de l'abonnement Stripe
      - `stripe_customer_id` (text) - ID du client Stripe
      - `current_period_start` (timestamptz) - Début de la période actuelle
      - `current_period_end` (timestamptz) - Fin de la période actuelle
      - `cancel_at_period_end` (boolean) - Annulation à la fin de la période
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Politique de lecture pour l'utilisateur propriétaire
    - Politique de mise à jour pour l'utilisateur propriétaire
*/

-- Créer la table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'trial',
  is_trial boolean NOT NULL DEFAULT true,
  trial_ends_at timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'past_due'))
);

-- Activer RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour l'utilisateur propriétaire
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique de mise à jour pour l'utilisateur propriétaire
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique d'insertion pour l'utilisateur propriétaire
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index pour les recherches rapides
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
