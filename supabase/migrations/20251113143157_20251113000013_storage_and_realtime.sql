/*
  # Migration 13: Storage Buckets and Realtime Configuration
  
  ## Overview
  Configure storage buckets for file uploads and enable realtime for tables
  
  ## Storage Buckets
  1. **avatars** - User profile avatars (public)
  2. **service-images** - Service images (public)
  3. **invoices** - Generated invoice PDFs (private)
  4. **company-logos** - Company logos for invoices (public)
  
  ## Realtime
  - Enable realtime for bookings, notifications, and other dynamic tables
  
  ## Security
  - Proper RLS policies for storage buckets
  - Public buckets for public images
  - Private buckets for sensitive documents
*/

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create service-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create invoices bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create company-logos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES: avatars
-- ============================================================================

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STORAGE POLICIES: service-images
-- ============================================================================

CREATE POLICY "Anyone can view service images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can update service images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can delete service images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'service-images');

-- ============================================================================
-- STORAGE POLICIES: invoices
-- ============================================================================

CREATE POLICY "Users can view their own invoices"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own invoices"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own invoices"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- STORAGE POLICIES: company-logos
-- ============================================================================

CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos');

-- ============================================================================
-- REALTIME CONFIGURATION
-- ============================================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE team_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE unavailabilities;
ALTER PUBLICATION supabase_realtime ADD TABLE blocked_date_ranges;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE pos_transactions;

-- Add comment
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication for live updates';