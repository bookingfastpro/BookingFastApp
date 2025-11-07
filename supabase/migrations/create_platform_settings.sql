/*
  # Create platform_settings table for Stripe configuration

  1. New Tables
    - `platform_settings`
      - `id` (integer, primary key) - Always 1 for singleton
      - `stripe_secret_key` (text) - Platform Stripe secret key
      - `stripe_public_key` (text) - Platform Stripe public key
      - `stripe_webhook_secret` (text) - Platform Stripe webhook secret
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `platform_settings` table
    - Only service role can access (no public policies)
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  stripe_secret_key text,
  stripe_public_key text,
  stripe_webhook_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Insert default row (will be updated with actual keys)
INSERT INTO platform_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_id ON platform_settings(id);
