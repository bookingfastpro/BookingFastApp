/*
  # Corriger les politiques RLS pour la visibilité restreinte

  1. Modifications
    - Supprime l'ancienne politique SELECT
    - Crée une nouvelle politique avec la colonne restricted_visibility correcte

  2. Sécurité
    - Les propriétaires voient toutes leurs réservations
    - Les membres avec restricted_visibility=false voient toutes les réservations
    - Les membres avec restricted_visibility=true ne voient que leurs réservations assignées
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;
DROP POLICY IF EXISTS "Bookings visibility based on team role" ON bookings;
DROP POLICY IF EXISTS "Public can view bookings for booking pages" ON bookings;

-- Créer la nouvelle politique SELECT avec restricted_visibility
CREATE POLICY "Bookings visibility based on team role"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    -- Le propriétaire voit toutes ses réservations
    user_id = auth.uid()
    OR
    -- Les membres d'équipe voient selon leurs restrictions
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.owner_id = bookings.user_id
        AND tm.is_active = true
        AND (
          -- Si restricted_visibility est false ou null, voir toutes les réservations
          (tm.restricted_visibility IS NULL OR tm.restricted_visibility = false)
          OR
          -- Si restricted_visibility est true, voir uniquement les réservations assignées
          (tm.restricted_visibility = true AND bookings.assigned_user_id = auth.uid())
        )
    )
  );

-- Permettre au public de voir les réservations (pour les pages de réservation publiques)
CREATE POLICY "Public can view bookings for booking pages"
  ON bookings FOR SELECT
  TO public
  USING (true);
