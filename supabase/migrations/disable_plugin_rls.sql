/*
  # Désactivation RLS pour les tables plugins

  1. Modifications
    - Désactivation complète du RLS sur plugins
    - Désactivation complète du RLS sur plugin_subscriptions
    - Désactivation complète du RLS sur plugin_configurations

  2. Sécurité
    - Sécurité gérée au niveau applicatif
    - Accès direct aux tables sans restrictions RLS
*/

-- Désactiver RLS sur la table plugins
ALTER TABLE plugins DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table plugin_subscriptions
ALTER TABLE plugin_subscriptions DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table plugin_configurations
ALTER TABLE plugin_configurations DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes pour nettoyer
DROP POLICY IF EXISTS "Authenticated users can view active plugins" ON plugins;
DROP POLICY IF EXISTS "Super admins can view all plugins" ON plugins;
DROP POLICY IF EXISTS "Super admins can insert plugins" ON plugins;
DROP POLICY IF EXISTS "Super admins can update plugins" ON plugins;
DROP POLICY IF EXISTS "Super admins can delete plugins" ON plugins;

DROP POLICY IF EXISTS "Users can view own plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Super admins can view all plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can create own plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can update own plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Super admins can update all plugin subscriptions" ON plugin_subscriptions;
DROP POLICY IF EXISTS "Users can delete own plugin subscriptions" ON plugin_subscriptions;

DROP POLICY IF EXISTS "Users can view own plugin configurations" ON plugin_configurations;
DROP POLICY IF EXISTS "Users can create own plugin configurations" ON plugin_configurations;
DROP POLICY IF EXISTS "Users can update own plugin configurations" ON plugin_configurations;
DROP POLICY IF EXISTS "Users can delete own plugin configurations" ON plugin_configurations;
DROP POLICY IF EXISTS "Super admins can manage all plugin configurations" ON plugin_configurations;
