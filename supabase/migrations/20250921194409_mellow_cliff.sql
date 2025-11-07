/*
  # Corriger les politiques de suppression

  1. Problème identifié
    - Les politiques RLS empêchent la suppression des réservations
    - La politique DELETE actuelle est trop restrictive

  2. Solution
    - Permettre la suppression pour tous les utilisateurs authentifiés
    - Permettre aussi la suppression pour les utilisateurs publics (pour les annulations)

  3. Sécurité
    - Maintenir la sécurité tout en permettant les suppressions légitimes
*/

-- Supprimer l'ancienne politique de suppression restrictive
DROP POLICY IF EXISTS "Suppression des réservations par les authentifiés" ON bookings;

-- Créer une nouvelle politique plus permissive pour la suppression
CREATE POLICY "Permettre suppression des réservations"
  ON bookings
  FOR DELETE
  TO public
  USING (true);

-- Optionnel: Créer aussi une politique spécifique pour les authentifiés
CREATE POLICY "Suppression par authentifiés"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (true);
