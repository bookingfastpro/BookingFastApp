/*
  # Gestion des versions de l'application

  1. New Tables
    - `app_versions`
      - `id` (uuid, primary key)
      - `version` (text, version de l'app ex: "1.2.3")
      - `build` (text, build number ex: "2025.01.28")
      - `release_notes` (text, notes de version)
      - `is_current` (boolean, version actuelle)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_versions` table
    - Add policy for public read access (pour affichage sur login)
    - Add policy for super admin write access

  3. Initial Data
    - Insert default version entry
*/

-- Créer la table des versions
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '1.2.3',
  build text NOT NULL DEFAULT '2025.01.28',
  release_notes text DEFAULT '',
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique (affichage sur page login)
CREATE POLICY "Anyone can view current app version"
  ON app_versions
  FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

-- Politique pour les super admins (écriture)
CREATE POLICY "Super admins can manage app versions"
  ON app_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_versions_updated_at
  BEFORE UPDATE ON app_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_app_versions_updated_at();

-- Fonction pour définir une version comme actuelle (désactive les autres)
CREATE OR REPLACE FUNCTION set_current_version(version_id uuid)
RETURNS void AS $$
BEGIN
  -- Désactiver toutes les versions
  UPDATE app_versions SET is_current = false;
  
  -- Activer la version spécifiée
  UPDATE app_versions 
  SET is_current = true, updated_at = now()
  WHERE id = version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer la version par défaut
INSERT INTO app_versions (version, build, release_notes, is_current)
VALUES (
  '1.2.3',
  '2025.01.28',
  'Version initiale avec gestion dynamique des versions',
  true
)
ON CONFLICT DO NOTHING;
