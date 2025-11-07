/*
  # Corriger les politiques RLS pour la table clients

  1. Sécurité
    - Supprimer les anciennes politiques restrictives
    - Permettre l'insertion et la mise à jour pour tous les utilisateurs publics
    - Maintenir la lecture publique
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Lecture publique des clients" ON clients;
DROP POLICY IF EXISTS "Modification des clients par les authentifiés" ON clients;

-- Créer de nouvelles politiques plus permissives
CREATE POLICY "Lecture publique des clients"
  ON clients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Insertion publique des clients"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Mise à jour publique des clients"
  ON clients
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Suppression par les authentifiés"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);
