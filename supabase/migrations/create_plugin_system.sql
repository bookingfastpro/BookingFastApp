/*
  # Système de Plugins

  1. Nouvelles Tables
    - `plugins`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du plugin
      - `slug` (text, unique) - Identifiant unique
      - `description` (text) - Description
      - `icon` (text) - Icône Lucide
      - `category` (text) - Catégorie
      - `base_price` (decimal) - Prix mensuel de base
      - `features` (jsonb) - Liste des fonctionnalités
      - `is_active` (boolean) - Actif globalement
      - `is_featured` (boolean) - Mis en avant
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `plugin_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `plugin_id` (uuid, foreign key)
      - `stripe_subscription_id` (text)
      - `status` (text) - active, cancelled, expired
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `activated_features` (jsonb) - Fonctionnalités activées
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `plugin_configurations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `plugin_id` (uuid, foreign key)
      - `settings` (jsonb) - Configuration du plugin
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour super admins et utilisateurs
*/

-- Table des plugins
CREATE TABLE IF NOT EXISTS plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Package',
  category text NOT NULL DEFAULT 'general',
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements aux plugins
CREATE TABLE IF NOT EXISTS plugin_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  activated_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

-- Table des configurations des plugins
CREATE TABLE IF NOT EXISTS plugin_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_user_id ON plugin_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_plugin_id ON plugin_subscriptions(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_status ON plugin_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_plugin_configurations_user_id ON plugin_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_plugins_slug ON plugins(slug);
CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active);

-- RLS
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_configurations ENABLE ROW LEVEL SECURITY;

-- Policies pour plugins (lecture publique, écriture super admin)
CREATE POLICY "Anyone can view active plugins"
  ON plugins FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins can manage plugins"
  ON plugins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Policies pour plugin_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON plugin_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
  ON plugin_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON plugin_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all subscriptions"
  ON plugin_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Policies pour plugin_configurations
CREATE POLICY "Users can manage own configurations"
  ON plugin_configurations FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Fonction pour vérifier si un utilisateur a accès à un plugin
CREATE OR REPLACE FUNCTION has_plugin_access(p_user_id uuid, p_plugin_slug text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND p.slug = p_plugin_slug
    AND ps.status = 'active'
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les plugins actifs d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  activated_features jsonb,
  settings jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    ps.activated_features,
    COALESCE(pc.settings, '{}'::jsonb)
  FROM plugin_subscriptions ps
  JOIN plugins p ON p.id = ps.plugin_id
  LEFT JOIN plugin_configurations pc ON pc.user_id = ps.user_id AND pc.plugin_id = ps.plugin_id
  WHERE ps.user_id = p_user_id
  AND ps.status = 'active'
  AND (ps.current_period_end IS NULL OR ps.current_period_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer les plugins initiaux
INSERT INTO plugins (name, slug, description, icon, category, base_price, features, is_featured) VALUES
(
  'Rapports Avancés',
  'reports',
  'Générez des rapports détaillés sur vos réservations, revenus et performances',
  'BarChart3',
  'analytics',
  19.99,
  '[
    {"id": "revenue_reports", "name": "Rapports de revenus", "description": "Analyse détaillée des revenus", "included": true},
    {"id": "booking_analytics", "name": "Analytiques de réservations", "description": "Statistiques sur les réservations", "included": true},
    {"id": "client_insights", "name": "Insights clients", "description": "Analyse du comportement client", "included": true},
    {"id": "export_excel", "name": "Export Excel", "description": "Exportez vos rapports en Excel", "included": false, "price": 5.00},
    {"id": "custom_reports", "name": "Rapports personnalisés", "description": "Créez vos propres rapports", "included": false, "price": 9.99}
  ]'::jsonb,
  true
),
(
  'VTC & Transport',
  'vtc',
  'Gestion complète pour services de transport et VTC',
  'Car',
  'transport',
  29.99,
  '[
    {"id": "driver_management", "name": "Gestion chauffeurs", "description": "Gérez votre flotte de chauffeurs", "included": true},
    {"id": "route_optimization", "name": "Optimisation trajets", "description": "Optimisez vos itinéraires", "included": true},
    {"id": "pricing_zones", "name": "Zones tarifaires", "description": "Définissez des zones de prix", "included": true},
    {"id": "real_time_tracking", "name": "Suivi temps réel", "description": "Suivez vos courses en direct", "included": false, "price": 10.00},
    {"id": "driver_app", "name": "App chauffeur", "description": "Application mobile pour chauffeurs", "included": false, "price": 15.00}
  ]'::jsonb,
  true
),
(
  'Réservations Multi-Utilisateurs',
  'multi-user',
  'Permettez à vos clients de créer des comptes et gérer leurs réservations',
  'Users',
  'booking',
  14.99,
  '[
    {"id": "client_accounts", "name": "Comptes clients", "description": "Vos clients créent leurs comptes", "included": true},
    {"id": "booking_history", "name": "Historique réservations", "description": "Historique complet pour chaque client", "included": true},
    {"id": "favorites", "name": "Services favoris", "description": "Clients sauvegardent leurs favoris", "included": true},
    {"id": "loyalty_program", "name": "Programme fidélité", "description": "Système de points de fidélité", "included": false, "price": 7.99},
    {"id": "referral_system", "name": "Système de parrainage", "description": "Parrainage entre clients", "included": false, "price": 5.00}
  ]'::jsonb,
  true
),
(
  'Marketing & Communication',
  'marketing',
  'Outils de marketing et communication avec vos clients',
  'Megaphone',
  'marketing',
  24.99,
  '[
    {"id": "email_campaigns", "name": "Campagnes email", "description": "Envoyez des campagnes marketing", "included": true},
    {"id": "sms_notifications", "name": "Notifications SMS", "description": "Envoyez des SMS à vos clients", "included": true},
    {"id": "promo_codes", "name": "Codes promo", "description": "Créez des codes promotionnels", "included": true},
    {"id": "automated_marketing", "name": "Marketing automatisé", "description": "Automatisez vos campagnes", "included": false, "price": 12.00},
    {"id": "ab_testing", "name": "Tests A/B", "description": "Testez vos campagnes", "included": false, "price": 8.00}
  ]'::jsonb,
  false
),
(
  'Gestion d''Inventaire',
  'inventory',
  'Gérez votre stock et vos ressources',
  'Package',
  'management',
  17.99,
  '[
    {"id": "stock_tracking", "name": "Suivi stock", "description": "Suivez votre inventaire en temps réel", "included": true},
    {"id": "low_stock_alerts", "name": "Alertes stock bas", "description": "Recevez des alertes", "included": true},
    {"id": "supplier_management", "name": "Gestion fournisseurs", "description": "Gérez vos fournisseurs", "included": true},
    {"id": "purchase_orders", "name": "Bons de commande", "description": "Créez des bons de commande", "included": false, "price": 6.00},
    {"id": "barcode_scanning", "name": "Scan codes-barres", "description": "Scannez vos produits", "included": false, "price": 9.99}
  ]'::jsonb,
  false
);
