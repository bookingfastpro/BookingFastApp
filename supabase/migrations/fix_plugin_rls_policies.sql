/*
  # Correction des politiques RLS pour les plugins

  1. Modifications
    - Suppression des anciennes policies restrictives
    - Ajout de nouvelles policies permettant la lecture pour tous les utilisateurs authentifiés
    - Maintien du contrôle d'écriture pour les super admins uniquement

  2. Sécurité
    - Lecture publique des plugins actifs pour tous les utilisateurs authentifiés
    - Lecture des abonnements uniquement pour l'utilisateur concerné
    - Écriture réservée aux super admins
*/

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Anyone can view active plugins" ON plugins;
DROP POLICY IF EXISTS "Super admins can manage plugins" ON plugins;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can manage own configurations" ON plugin_configurations;

-- ============================================
-- POLICIES POUR LA TABLE PLUGINS
-- ============================================

-- Lecture : Tous les utilisateurs authentifiés peuvent voir les plugins actifs
CREATE POLICY "Authenticated users can view active plugins"
  ON plugins
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Lecture complète : Super admins peuvent voir tous les plugins
CREATE POLICY "Super admins can view all plugins"
  ON plugins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Insertion : Super admins uniquement
CREATE POLICY "Super admins can insert plugins"
  ON plugins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Mise à jour : Super admins uniquement
CREATE POLICY "Super admins can update plugins"
  ON plugins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Suppression : Super admins uniquement
CREATE POLICY "Super admins can delete plugins"
  ON plugins
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- ============================================
-- POLICIES POUR LA TABLE PLUGIN_SUBSCRIPTIONS
-- ============================================

-- Lecture : Utilisateurs peuvent voir leurs propres abonnements
CREATE POLICY "Users can view own plugin subscriptions"
  ON plugin_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Lecture complète : Super admins peuvent voir tous les abonnements
CREATE POLICY "Super admins can view all plugin subscriptions"
  ON plugin_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Insertion : Utilisateurs peuvent créer leurs propres abonnements
CREATE POLICY "Users can create own plugin subscriptions"
  ON plugin_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Mise à jour : Utilisateurs peuvent modifier leurs propres abonnements
CREATE POLICY "Users can update own plugin subscriptions"
  ON plugin_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Mise à jour complète : Super admins peuvent modifier tous les abonnements
CREATE POLICY "Super admins can update all plugin subscriptions"
  ON plugin_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Suppression : Utilisateurs peuvent supprimer leurs propres abonnements
CREATE POLICY "Users can delete own plugin subscriptions"
  ON plugin_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- POLICIES POUR LA TABLE PLUGIN_CONFIGURATIONS
-- ============================================

-- Lecture : Utilisateurs peuvent voir leurs propres configurations
CREATE POLICY "Users can view own plugin configurations"
  ON plugin_configurations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insertion : Utilisateurs peuvent créer leurs propres configurations
CREATE POLICY "Users can create own plugin configurations"
  ON plugin_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Mise à jour : Utilisateurs peuvent modifier leurs propres configurations
CREATE POLICY "Users can update own plugin configurations"
  ON plugin_configurations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Suppression : Utilisateurs peuvent supprimer leurs propres configurations
CREATE POLICY "Users can delete own plugin configurations"
  ON plugin_configurations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins ont accès complet aux configurations
CREATE POLICY "Super admins can manage all plugin configurations"
  ON plugin_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );
