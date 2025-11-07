/*
  # Création de la table clients

  1. Nouvelle Table
    - `clients`
      - `id` (uuid, clé primaire)
      - `firstname` (text, prénom du client)
      - `lastname` (text, nom du client)
      - `email` (text, email unique)
      - `phone` (text, téléphone)
      - `created_at` (timestamp, date de création)
      - `updated_at` (timestamp, date de mise à jour)

  2. Sécurité
    - Activer RLS sur la table `clients`
    - Politique de lecture publique
    - Politique de modification pour les authentifiés

  3. Index
    - Index sur l'email pour les recherches rapides
    - Index sur le nom et prénom pour les recherches textuelles
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname text NOT NULL,
  lastname text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Lecture publique des clients"
  ON clients
  FOR SELECT
  TO public
  USING (true);

-- Politique de modification pour les authentifiés
CREATE POLICY "Modification des clients par les authentifiés"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (firstname, lastname);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);
