/*
  # Ajout option sélection membre d'équipe dans iframe

  1. Modifications
    - Ajoute la colonne `iframe_enable_team_selection` à `business_settings`
    - Permet aux clients de choisir un membre d'équipe lors de la réservation publique
*/

-- Ajouter la colonne pour activer la sélection de membre dans l'iframe
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS iframe_enable_team_selection boolean DEFAULT false;

-- Commentaire pour documentation
COMMENT ON COLUMN business_settings.iframe_enable_team_selection IS 'Permet aux clients de sélectionner un membre d''équipe dans l''iframe de réservation publique';
