/*
  # Fix Payment Links INSERT Policy - FINAL

  1. Problème identifié
    - La politique INSERT utilise `uid()` au lieu de `auth.uid()`
    - La fonction `uid()` n'existe pas dans Supabase
    - USING clause est NULL (devrait être identique à WITH CHECK)

  2. Solution
    - Supprimer la politique INSERT cassée
    - Créer une nouvelle politique avec `auth.uid()`
    - Ajouter USING clause identique à WITH CHECK

  3. Sécurité
    - Seuls les utilisateurs authentifiés peuvent créer
    - Un utilisateur ne peut créer que ses propres liens
    - Vérification via auth.uid() = user_id
*/

-- 🔥 SUPPRIMER LA POLITIQUE CASSÉE
DROP POLICY IF EXISTS "Authenticated users can insert payment links" ON payment_links;

-- 🔥 CRÉER LA NOUVELLE POLITIQUE CORRECTE
CREATE POLICY "Authenticated users can insert payment links"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 🔥 VÉRIFIER LES AUTRES POLITIQUES
DROP POLICY IF EXISTS "Authenticated users can update own payment links" ON payment_links;
CREATE POLICY "Authenticated users can update own payment links"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete own payment links" ON payment_links;
CREATE POLICY "Authenticated users can delete own payment links"
  ON payment_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
