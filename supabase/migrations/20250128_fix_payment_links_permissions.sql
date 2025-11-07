/*
  # Fix complet des permissions payment_links

  1. Modifications
    - Vérifier et activer RLS
    - Supprimer toutes les anciennes politiques
    - Recréer les politiques avec les bonnes permissions
    - Accorder les permissions PostgreSQL au rôle anon

  2. Sécurité
    - Lecture publique pour la page de paiement
    - Création/modification/suppression réservées aux utilisateurs authentifiés
*/

-- 1️⃣ S'assurer que RLS est activé
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Public can view payment links for payment page" ON payment_links;
DROP POLICY IF EXISTS "Users can create own payment links" ON payment_links;
DROP POLICY IF EXISTS "Users can update own payment links" ON payment_links;
DROP POLICY IF EXISTS "Users can delete own payment links" ON payment_links;

-- 3️⃣ Recréer les politiques dans le bon ordre

-- 🔥 POLITIQUE CRITIQUE : Lecture publique (anon + authenticated)
CREATE POLICY "Public can view payment links for payment page"
  ON payment_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique : Création réservée aux utilisateurs authentifiés
CREATE POLICY "Users can create own payment links"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique : Mise à jour réservée aux utilisateurs authentifiés
CREATE POLICY "Users can update own payment links"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique : Suppression réservée aux utilisateurs authentifiés
CREATE POLICY "Users can delete own payment links"
  ON payment_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4️⃣ Accorder les permissions PostgreSQL au rôle anon
-- C'est CRITIQUE pour que les requêtes non authentifiées fonctionnent
GRANT SELECT ON payment_links TO anon;
GRANT SELECT ON payment_links TO authenticated;

-- 5️⃣ Accorder les permissions sur les tables liées (pour les jointures)
GRANT SELECT ON bookings TO anon;
GRANT SELECT ON bookings TO authenticated;
GRANT SELECT ON services TO anon;
GRANT SELECT ON services TO authenticated;
