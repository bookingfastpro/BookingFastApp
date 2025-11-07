/*
  # Correction forcée des permissions RLS pour unavailabilities

  1. Actions
    - Désactivation temporaire de RLS
    - Suppression de toutes les politiques
    - Recréation des politiques avec permissions explicites
    - Réactivation de RLS
  
  2. Sécurité
    - Politiques simplifiées et permissives pour authenticated users
    - Support multi-utilisateur
*/

-- Désactiver temporairement RLS
ALTER TABLE unavailabilities DISABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'unavailabilities'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON unavailabilities', pol.policyname);
    END LOOP;
END $$;

-- Réactiver RLS
ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;

-- Politique SELECT - Très permissive pour authenticated
CREATE POLICY "authenticated_select_unavailabilities"
  ON unavailabilities FOR SELECT
  TO authenticated
  USING (true);

-- Politique INSERT - Permettre à tout utilisateur authentifié d'insérer
CREATE POLICY "authenticated_insert_unavailabilities"
  ON unavailabilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique UPDATE - Permettre à tout utilisateur authentifié de modifier
CREATE POLICY "authenticated_update_unavailabilities"
  ON unavailabilities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique DELETE - Permettre à tout utilisateur authentifié de supprimer
CREATE POLICY "authenticated_delete_unavailabilities"
  ON unavailabilities FOR DELETE
  TO authenticated
  USING (true);

-- Vérifier que RLS est bien activé
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'unavailabilities') THEN
    RAISE EXCEPTION 'RLS is not enabled on unavailabilities table';
  END IF;
END $$;
