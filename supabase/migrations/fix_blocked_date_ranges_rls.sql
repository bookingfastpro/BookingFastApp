/*
  # Fix RLS pour blocked_date_ranges
  
  1. Suppression des anciennes policies
  2. Création de nouvelles policies plus permissives
  3. Ajout de policies séparées pour INSERT/UPDATE/DELETE
*/

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Owners can manage their blocked date ranges" ON blocked_date_ranges;
DROP POLICY IF EXISTS "Public can view blocked date ranges" ON blocked_date_ranges;

-- Policy pour INSERT (création)
CREATE POLICY "Users can insert their own blocked date ranges"
  ON blocked_date_ranges FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.owner_id = blocked_date_ranges.user_id
      AND team_members.is_active = true
    )
  );

-- Policy pour SELECT (lecture)
CREATE POLICY "Users can view their blocked date ranges"
  ON blocked_date_ranges FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.owner_id = user_id
      AND team_members.is_active = true
    )
  );

-- Policy pour UPDATE (modification)
CREATE POLICY "Users can update their blocked date ranges"
  ON blocked_date_ranges FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.owner_id = user_id
      AND team_members.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.owner_id = user_id
      AND team_members.is_active = true
    )
  );

-- Policy pour DELETE (suppression)
CREATE POLICY "Users can delete their blocked date ranges"
  ON blocked_date_ranges FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
      AND team_members.owner_id = user_id
      AND team_members.is_active = true
    )
  );

-- Policy pour accès public (lecture seule pour iframe)
CREATE POLICY "Public can view all blocked date ranges"
  ON blocked_date_ranges FOR SELECT
  TO anon
  USING (true);
