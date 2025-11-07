/*
  # Correction des politiques RLS pour les services personnalisés

  1. Modifications
    - Mise à jour de la politique d'insertion pour permettre aux utilisateurs authentifiés de créer des services
    - Ajout d'une vérification user_id pour s'assurer que les utilisateurs ne peuvent créer que leurs propres services
  
  2. Sécurité
    - Les utilisateurs authentifiés peuvent créer leurs propres services
    - Les utilisateurs ne peuvent pas créer de services pour d'autres utilisateurs
*/

-- Supprimer l'ancienne politique d'édition globale
DROP POLICY IF EXISTS "Services are editable by authenticated users" ON services;

-- Créer des politiques plus granulaires
CREATE POLICY "Users can insert their own services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON services
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
