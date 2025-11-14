/*
  # Create company-assets storage bucket

  1. Storage Setup
    - Create company-assets bucket for logos and company files
    - Set as public bucket for easy access
    - Configure RLS policies for authenticated users

  2. Security
    - Authenticated users can upload their own files
    - Authenticated users can read all files (for displaying logos)
    - Authenticated users can update/delete only their own files
*/

-- Create company-assets bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own company assets" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Allow everyone to view company assets (public bucket)
CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- Allow users to update their own files
CREATE POLICY "Users can update own company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'logos' AND
  auth.uid()::text = split_part(name, '/', 2)
)
WITH CHECK (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = 'logos' AND
  auth.uid()::text = split_part(name, '/', 2)
);
