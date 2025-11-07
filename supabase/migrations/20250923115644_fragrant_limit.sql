/*
  # Create push subscriptions table

  1. New Tables
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subscription_data` (jsonb, contains push subscription object)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `push_subscriptions` table
    - Add policy for users to manage their own subscriptions

  3. Indexes
    - Index on user_id for performance
*/

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Index pour améliorer les performances de recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions (user_id);

-- Activer Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Créer une politique RLS pour permettre aux utilisateurs de gérer leurs propres abonnements
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
