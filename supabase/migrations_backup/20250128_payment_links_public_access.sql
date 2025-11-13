/*
  # Accès public aux liens de paiement

  1. Modifications
    - Ajouter une politique RLS pour permettre la lecture publique des liens de paiement
    - Permet aux utilisateurs non authentifiés d'accéder à la page de paiement
    - Sécurisé : lecture seule, pas de modification possible

  2. Sécurité
    - Lecture publique uniquement (SELECT)
    - Aucune modification possible sans authentification
    - Les autres opérations (INSERT, UPDATE, DELETE) restent protégées
*/

-- 🔥 POLITIQUE CRITIQUE : Lecture publique pour la page de paiement
-- Cette politique permet à TOUT LE MONDE (authentifié ou non) de lire les liens de paiement
-- C'est nécessaire pour que la page de paiement fonctionne sans connexion
DROP POLICY IF EXISTS "Public can view payment links for payment page" ON payment_links;

CREATE POLICY "Public can view payment links for payment page"
  ON payment_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note : Les autres politiques (INSERT, UPDATE, DELETE) restent inchangées
-- Seuls les utilisateurs authentifiés peuvent créer/modifier/supprimer leurs liens
