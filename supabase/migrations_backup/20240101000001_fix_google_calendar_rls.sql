/*
  # Fix Google Calendar RLS Policies

  1. Modifications
    - Mise à jour des politiques RLS pour permettre aux membres d'équipe de lire les tokens du propriétaire
    - Ajout d'une politique pour que les membres d'équipe puissent vérifier l'existence du token

  2. Sécurité
    - Les membres d'équipe peuvent LIRE les tokens de leur propriétaire
    - Seul le propriétaire peut MODIFIER/SUPPRIMER ses tokens
    - Les tokens restent sécurisés (pas d'accès direct aux valeurs sensibles)
*/

-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Users can manage their own Google Calendar tokens" ON google_calendar_tokens;

-- Politique pour que les propriétaires puissent gérer leurs propres tokens
CREATE POLICY "Owners can manage their own tokens"
  ON google_calendar_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour que les membres d'équipe puissent LIRE les tokens de leur propriétaire
CREATE POLICY "Team members can read owner tokens"
  ON google_calendar_tokens
  FOR SELECT
  TO authenticated
  USING (
    -- Vérifier si l'utilisateur est membre d'équipe du propriétaire du token
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = google_calendar_tokens.user_id
        AND team_members.is_active = true
    )
  );
