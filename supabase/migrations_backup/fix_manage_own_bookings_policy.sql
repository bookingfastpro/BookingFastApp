/*
  # Correction de la politique "Authenticated users can manage own bookings"
  
  1. Changements
    - Suppression de la politique ALL problématique
    - Remplacement par des politiques simples sans substring
  
  2. Sécurité
    - Maintien du contrôle d'accès basé sur user_id
    - Pas d'opérations sur les champs time/date
*/

-- Supprimer la politique problématique
DROP POLICY IF EXISTS "Authenticated users can manage own bookings" ON bookings;

-- Recréer avec une logique simple sans substring
CREATE POLICY "Authenticated users can manage own bookings - SELECT"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = bookings.user_id 
        AND tm.is_active = true
    ))
  );

CREATE POLICY "Authenticated users can manage own bookings - INSERT"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = bookings.user_id 
        AND tm.is_active = true
    ))
  );

CREATE POLICY "Authenticated users can manage own bookings - UPDATE"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = bookings.user_id 
        AND tm.is_active = true
    ))
  )
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = bookings.user_id 
        AND tm.is_active = true
    ))
  );

CREATE POLICY "Authenticated users can manage own bookings - DELETE"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = bookings.user_id 
        AND tm.is_active = true
    ))
  );
