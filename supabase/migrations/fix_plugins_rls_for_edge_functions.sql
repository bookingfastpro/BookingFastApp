/*
  # Fix RLS pour permettre aux Edge Functions de lire les plugins

  1. Modifications
    - Ajoute une politique RLS pour permettre aux Edge Functions (service_role) de lire les plugins
    - Permet la lecture publique des plugins actifs pour l'affichage
*/

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public can view active plugins" ON plugins;
DROP POLICY IF EXISTS "Service role can read all plugins" ON plugins;

-- Permettre la lecture publique des plugins actifs (pour l'affichage dans l'UI)
CREATE POLICY "Public can view active plugins"
  ON plugins
  FOR SELECT
  USING (is_active = true);

-- CRITIQUE: Permettre au service_role (Edge Functions) de lire TOUS les plugins
-- Ceci est nécessaire pour que stripe-checkout puisse récupérer le stripe_price_id
CREATE POLICY "Service role can read all plugins"
  ON plugins
  FOR SELECT
  TO service_role
  USING (true);

-- S'assurer que RLS est activé
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;
