/*
  # Création bucket Storage pour assets entreprise

  1. Nouveau bucket
    - `company-assets` pour logos et documents
  
  2. Sécurité
    - Policies pour upload/lecture
*/

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY IF NOT EXISTS "Users can upload their own assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Policy pour permettre la lecture publique
CREATE POLICY IF NOT EXISTS "Public can view assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- Policy pour permettre aux utilisateurs de supprimer leurs assets
CREATE POLICY IF NOT EXISTS "Users can delete their own assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'logos'
);
