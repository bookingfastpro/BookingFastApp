/*
  # Ajout du support OneSignal pour les notifications push

  1. Modifications de la table profiles
    - Ajout de la colonne `onesignal_player_id` pour stocker l'ID d'abonnement OneSignal
    - Ajout de la colonne `push_notifications_enabled` pour permettre à l'utilisateur d'activer/désactiver les notifications push
    - Index sur onesignal_player_id pour des recherches rapides

  2. Table de logs pour OneSignal
    - Création de la table `onesignal_logs` pour tracer les envois de notifications
    - Colonnes: id, user_id, notification_id, player_id, status, error_message, created_at
    - RLS activé pour que seul l'utilisateur puisse voir ses propres logs

  3. Sécurité
    - Politique RLS pour permettre aux utilisateurs de mettre à jour leur onesignal_player_id
    - Politique RLS pour la table onesignal_logs
*/

-- Ajouter les colonnes OneSignal à la table profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onesignal_player_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onesignal_player_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'push_notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN push_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Index sur onesignal_player_id pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_onesignal_player_id 
  ON profiles(onesignal_player_id) 
  WHERE onesignal_player_id IS NOT NULL;

-- Table pour logger les envois de notifications OneSignal
CREATE TABLE IF NOT EXISTS onesignal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  player_id text,
  status text NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  response_data jsonb,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Activer RLS sur onesignal_logs
ALTER TABLE onesignal_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent voir leurs propres logs
CREATE POLICY "Users can read own onesignal logs"
  ON onesignal_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique pour que le service role puisse insérer des logs
CREATE POLICY "Service role can insert onesignal logs"
  ON onesignal_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Index pour optimiser les requêtes de logs
CREATE INDEX IF NOT EXISTS idx_onesignal_logs_user_id ON onesignal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_logs_created_at ON onesignal_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onesignal_logs_status ON onesignal_logs(status);

-- Mettre à jour la politique RLS pour permettre aux utilisateurs de mettre à jour leur onesignal_player_id
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
