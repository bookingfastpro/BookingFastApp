/*
  # Correction des politiques RLS pour payment_links

  1. Problème
    - La politique SELECT existe (accès public)
    - Mais AUCUNE politique INSERT pour les utilisateurs authentifiés
    - Erreur: permission denied for table payment_links (42501)

  2. Solution
    - Ajouter politique INSERT pour authenticated users
    - Permettre aux utilisateurs de créer leurs propres liens
    - Vérifier que user_id correspond à auth.uid()

  3. Sécurité
    - Seuls les utilisateurs authentifiés peuvent créer des liens
    - Un utilisateur ne peut créer que ses propres liens
    - Les liens restent lisibles publiquement (pour la page de paiement)
*/

-- 🔥 POLITIQUE CRITIQUE : Permettre INSERT pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can create payment links"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 🔥 POLITIQUE : Permettre UPDATE pour utilisateurs authentifiés (leurs propres liens)
CREATE POLICY "Authenticated users can update own payment links"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 🔥 POLITIQUE : Permettre DELETE pour utilisateurs authentifiés (leurs propres liens)
CREATE POLICY "Authenticated users can delete own payment links"
  ON payment_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
