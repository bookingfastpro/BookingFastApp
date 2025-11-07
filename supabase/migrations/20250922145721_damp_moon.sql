/*
  # Créer les tables pour les workflows et templates d'email

  1. Nouvelles Tables
    - `email_workflows`
      - `id` (text, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `name` (text)
      - `description` (text)
      - `trigger` (text)
      - `template_id` (text)
      - `delay` (integer)
      - `active` (boolean)
      - `conditions` (jsonb)
      - `sent_count` (integer)
      - `success_rate` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_templates`
      - `id` (text, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `name` (text)
      - `description` (text)
      - `subject` (text)
      - `html_content` (text)
      - `text_content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur les deux tables
    - Politiques pour que les utilisateurs ne voient que leurs propres données
*/

-- Créer la table email_workflows
CREATE TABLE IF NOT EXISTS email_workflows (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  trigger text NOT NULL,
  template_id text NOT NULL,
  delay integer DEFAULT 0,
  active boolean DEFAULT true,
  conditions jsonb DEFAULT '[]'::jsonb,
  sent_count integer DEFAULT 0,
  success_rate integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  subject text NOT NULL,
  html_content text DEFAULT '',
  text_content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur les deux tables
ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Politiques pour email_workflows
CREATE POLICY "Users can view their own workflows"
  ON email_workflows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
  ON email_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON email_workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON email_workflows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques pour email_templates
CREATE POLICY "Users can view their own templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON email_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_email_workflows_user_id ON email_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_email_workflows_trigger ON email_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_email_workflows_active ON email_workflows(active);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
