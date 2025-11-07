/*
  # Fix Payment Links RLS - Version 3
  
  1. Problème
    - Les politiques continuent d'utiliser uid() au lieu de auth.uid()
    - Les modifications manuelles ne sont pas persistées
    
  2. Solution
    - Supprimer TOUTES les politiques existantes
    - Recréer avec auth.uid() explicite
    - Utiliser un nom de migration unique
*/

-- Désactiver RLS temporairement
ALTER TABLE payment_links DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "Authenticated users can delete own payment links" ON payment_links;
DROP POLICY IF EXISTS "Authenticated users can insert payment links" ON payment_links;
DROP POLICY IF EXISTS "Users can view own payment links" ON payment_links;
DROP POLICY IF EXISTS "Authenticated users can update own payment links" ON payment_links;

-- Réactiver RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Créer les nouvelles politiques avec auth.uid()
CREATE POLICY "payment_links_insert_policy"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_links_update_policy"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_links_delete_policy"
  ON payment_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "payment_links_select_policy"
  ON payment_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
