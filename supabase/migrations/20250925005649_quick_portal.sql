/*
  # Create access codes and redemptions tables

  1. New Tables
    - `access_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `description` (text, optional)
      - `access_type` (text, enum: days/weeks/months/lifetime)
      - `access_duration` (integer, duration in units)
      - `max_uses` (integer, maximum uses allowed)
      - `current_uses` (integer, current usage count)
      - `is_active` (boolean, active status)
      - `created_by` (uuid, creator reference)
      - `expires_at` (timestamptz, expiration date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `code_redemptions`
      - `id` (uuid, primary key)
      - `code_id` (uuid, foreign key to access_codes)
      - `user_id` (uuid, foreign key to auth.users)
      - `redeemed_at` (timestamptz, redemption timestamp)
      - `access_granted_until` (timestamptz, access expiration)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Super admins can manage access codes
    - Users can view their own redemptions
    - Super admins can manage all redemptions

  3. Constraints
    - Unique constraint on code
    - Unique constraint on (code_id, user_id) for redemptions
    - Check constraint on access_type values
*/

-- Create access_codes table
CREATE TABLE IF NOT EXISTS public.access_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    description text,
    access_type text NOT NULL CHECK (access_type IN ('days', 'weeks', 'months', 'lifetime')),
    access_duration integer,
    max_uses integer NOT NULL DEFAULT 1,
    current_uses integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on access_codes
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins to manage access codes
CREATE POLICY "Super admins can manage access codes" 
ON public.access_codes 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND is_super_admin = true
    )
);

-- Create code_redemptions table
CREATE TABLE IF NOT EXISTS public.code_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id uuid NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    redeemed_at timestamptz DEFAULT now() NOT NULL,
    access_granted_until timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (code_id, user_id)
);

-- Enable RLS on code_redemptions
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own redemptions
CREATE POLICY "Users can view their own redemptions" 
ON public.code_redemptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for super admins to manage all redemptions
CREATE POLICY "Super admins can manage all redemptions" 
ON public.code_redemptions 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND is_super_admin = true
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_created_by ON public.access_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_access_codes_is_active ON public.access_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_id ON public.code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON public.code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_redeemed_at ON public.code_redemptions(redeemed_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_access_codes_updated_at'
    ) THEN
        CREATE TRIGGER update_access_codes_updated_at
            BEFORE UPDATE ON public.access_codes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_code_redemptions_updated_at'
    ) THEN
        CREATE TRIGGER update_code_redemptions_updated_at
            BEFORE UPDATE ON public.code_redemptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
