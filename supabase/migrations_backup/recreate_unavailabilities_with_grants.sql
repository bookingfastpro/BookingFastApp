/*
  # Recréation de la table unavailabilities avec permissions correctes

  1. Actions
    - Suppression de la table existante
    - Recréation avec les bonnes permissions
    - Grant explicites pour authenticated et anon
    - Politiques RLS permissives
  
  2. Sécurité
    - Permissions explicites au niveau table
    - RLS activé avec politiques permissives
*/

-- Supprimer la table existante
DROP TABLE IF EXISTS unavailabilities CASCADE;

-- Recréer la table
CREATE TABLE unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  assigned_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index
CREATE INDEX idx_unavailabilities_user_id ON unavailabilities(user_id);
CREATE INDEX idx_unavailabilities_date ON unavailabilities(date);
CREATE INDEX idx_unavailabilities_assigned_user ON unavailabilities(assigned_user_id);

-- GRANT explicites pour les rôles Supabase
GRANT ALL ON unavailabilities TO authenticated;
GRANT ALL ON unavailabilities TO anon;
GRANT ALL ON unavailabilities TO service_role;

-- Activer RLS
ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;

-- Politiques ultra-permissives pour authenticated
CREATE POLICY "authenticated_all_unavailabilities"
  ON unavailabilities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique pour anon (au cas où)
CREATE POLICY "anon_all_unavailabilities"
  ON unavailabilities
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
