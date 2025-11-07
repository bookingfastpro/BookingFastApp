/*
  # Correction des politiques RLS pour les indisponibilités

  1. Modifications
    - Suppression et recréation des politiques RLS
    - Simplification des politiques pour permettre l'insertion
    - Ajout de politiques plus permissives pour les utilisateurs authentifiés
  
  2. Sécurité
    - Les utilisateurs authentifiés peuvent créer leurs propres indisponibilités
    - Les utilisateurs peuvent voir et gérer leurs indisponibilités
    - Support multi-utilisateur via team_members
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their unavailabilities" ON unavailabilities;
DROP POLICY IF EXISTS "Users can create unavailabilities" ON unavailabilities;
DROP POLICY IF EXISTS "Users can update their unavailabilities" ON unavailabilities;
DROP POLICY IF EXISTS "Users can delete their unavailabilities" ON unavailabilities;

-- Politique de lecture (SELECT)
CREATE POLICY "Users can view unavailabilities"
  ON unavailabilities FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.owner_id = unavailabilities.user_id 
      AND team_members.user_id = auth.uid()
      AND team_members.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = unavailabilities.user_id 
      AND team_members.owner_id = auth.uid()
      AND team_members.is_active = true
    )
  );

-- Politique de création (INSERT)
CREATE POLICY "Users can create unavailabilities"
  ON unavailabilities FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.owner_id = unavailabilities.user_id 
      AND team_members.user_id = auth.uid()
      AND team_members.is_active = true
    )
  );

-- Politique de mise à jour (UPDATE)
CREATE POLICY "Users can update unavailabilities"
  ON unavailabilities FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.owner_id = unavailabilities.user_id 
      AND team_members.user_id = auth.uid()
      AND team_members.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.owner_id = unavailabilities.user_id 
      AND team_members.user_id = auth.uid()
      AND team_members.is_active = true
    )
  );

-- Politique de suppression (DELETE)
CREATE POLICY "Users can delete unavailabilities"
  ON unavailabilities FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.owner_id = unavailabilities.user_id 
      AND team_members.user_id = auth.uid()
      AND team_members.is_active = true
    )
  );
