/*
  # Fix Payment Links INSERT Policy

  1. Problème
    - Les politiques INSERT existantes ont qual: NULL
    - Elles ne permettent pas l'insertion malgré l'authentification
    - Erreur: permission denied for table payment_links (42501)

  2. Solution
    - Supprimer les anciennes politiques INSERT
    - Créer une nouvelle politique INSERT avec WITH CHECK correct
    - Permettre aux utilisateurs authentifiés de créer leurs propres liens

  3. Sécurité
    - Vérifier que user_id correspond à auth.uid()
    - Seuls les utilisateurs authentifiés peuvent créer
    - Les liens restent lisibles publiquement (pour la page de paiement)
*/

-- 🔥 SUPPRIMER LES ANCIENNES POLITIQUES INSERT
DROP POLICY IF EXISTS "Users can create own payment links" ON payment_links;
DROP POLICY IF EXISTS "Authenticated users can create payment links" ON payment_links;

-- 🔥 CRÉER LA NOUVELLE POLITIQUE INSERT CORRECTE
CREATE POLICY "Authenticated users can insert payment links"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 🔥 VÉRIFIER/RECRÉER LES POLITIQUES UPDATE ET DELETE
DROP POLICY IF EXISTS "Users can update own payment links" ON payment_links;
DROP POLICY IF EXISTS "Authenticated users can update own payment links" ON payment_links;

CREATE POLICY "Authenticated users can update own payment links"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment links" ON payment_links;
DROP POLICY IF EXISTS "Authenticated users can delete own payment links" ON payment_links;

CREATE POLICY "Authenticated users can delete own payment links"
  ON payment_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
