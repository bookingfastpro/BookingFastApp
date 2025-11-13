/*
  # Gestion des versions de l'application

  1. Nouvelles Tables
    - `app_versions`
      - `id` (uuid, primary key)
      - `version` (text) - Numéro de version (ex: "1.2.3")
      - `build` (text) - Build/date (ex: "2025.01.28")
      - `release_notes` (text, optionnel) - Notes de version
      - `is_current` (boolean) - Version actuellement affichée
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `app_versions`
    - Politique pour que tout le monde puisse voir la version actuelle
    - Politique pour que seuls les super admins puissent gérer les versions

  3. Fonctions
    - `set_current_version()` pour changer la version active
    - `update_updated_at_column()` pour les triggers de mise à jour
*/

-- Créer la table app_versions
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

-- Politique pour que tout le monde puisse voir la version actuelle
CREATE POLICY "Anyone can view current app version"
  ON app_versions
  FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

-- Politique pour que seuls les super admins puissent gérer les versions
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

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_app_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
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

-- Insérer une version par défaut si aucune n'existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_versions WHERE is_current = true) THEN
    INSERT INTO app_versions (version, build, release_notes, is_current)
    VALUES ('1.2.3', '2025.01.28', 'Version initiale avec gestion dynamique des versions', true);
  END IF;
END $$;

-- Vérifier que tout fonctionne
SELECT 
  version, 
  build, 
  release_notes, 
  is_current, 
  created_at 
FROM app_versions 
ORDER BY created_at DESC;
