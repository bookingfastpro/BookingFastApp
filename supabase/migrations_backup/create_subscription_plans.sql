/*
  # Création de la table subscription_plans

  1. Nouvelle Table
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du plan
      - `plan_id` (text) - Identifiant unique (starter, monthly, yearly)
      - `price_monthly` (numeric) - Prix mensuel
      - `price_yearly` (numeric) - Prix annuel (si applicable)
      - `features` (jsonb) - Liste des fonctionnalités
      - `stripe_price_id` (text) - ID du prix Stripe
      - `is_active` (boolean) - Plan actif ou non
      - `display_order` (integer) - Ordre d'affichage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Politique de lecture publique
    - Politique de gestion pour les admins
*/

-- Supprimer la table si elle existe déjà (pour éviter les conflits)
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Créer la table subscription_plans
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan_id text UNIQUE NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  TO public
  USING (is_active = true);

-- Politique de gestion pour les utilisateurs authentifiés (admins)
CREATE POLICY "Authenticated users can manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insérer les 3 plans d'abonnement
INSERT INTO subscription_plans (name, plan_id, price_monthly, price_yearly, features, display_order) VALUES
(
  'Starter Mensuel',
  'starter',
  29.99,
  NULL,
  '[
    "Réservations illimitées",
    "Gestion des clients",
    "Calendrier intégré",
    "Support email",
    "Idéal pour démarrer"
  ]'::jsonb,
  1
),
(
  'Plan Pro Mensuel',
  'monthly',
  49.99,
  NULL,
  '[
    "Tout du plan Starter",
    "Paiements en ligne Stripe",
    "Workflows email automatiques",
    "Gestion d''équipe",
    "Support prioritaire"
  ]'::jsonb,
  2
),
(
  'Plan Pro Annuel',
  'yearly',
  41.66,
  499.99,
  '[
    "Tout du plan Pro",
    "2 mois gratuits",
    "Support prioritaire 24/7",
    "Fonctionnalités avancées",
    "Accès aux bêtas",
    "Formation personnalisée"
  ]'::jsonb,
  3
);

-- Créer un index sur plan_id pour les recherches rapides
CREATE INDEX idx_subscription_plans_plan_id ON subscription_plans(plan_id);

-- Créer un index sur is_active pour filtrer les plans actifs
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
