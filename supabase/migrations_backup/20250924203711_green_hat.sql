/*
  # Ajouter user_id aux tables pour la séparation des comptes

  1. Modifications des tables
    - Ajouter `user_id` à `services`, `clients`, `business_settings`
    - Créer des index pour les performances
    - Mettre à jour les politiques RLS

  2. Migration des données existantes
    - Assigner les données au premier utilisateur créé (compte principal)

  3. Sécurité
    - Politiques RLS mises à jour pour respecter la séparation des comptes
    - Les utilisateurs créés via admin peuvent accéder aux données du compte principal
*/

-- Ajouter user_id à la table services si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE services ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Assigner les services existants au premier utilisateur créé
    UPDATE services 
    SET user_id = (
      SELECT id FROM users ORDER BY created_at ASC LIMIT 1
    )
    WHERE user_id IS NULL;
    
    -- Rendre la colonne obligatoire après migration
    ALTER TABLE services ALTER COLUMN user_id SET NOT NULL;
    
    -- Créer un index pour les performances
    CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
  END IF;
END $$;

-- Ajouter user_id à la table clients si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Assigner les clients existants au premier utilisateur créé
    UPDATE clients 
    SET user_id = (
      SELECT id FROM users ORDER BY created_at ASC LIMIT 1
    )
    WHERE user_id IS NULL;
    
    -- Rendre la colonne obligatoire après migration
    ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
    
    -- Créer un index pour les performances
    CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  END IF;
END $$;

-- Ajouter user_id à la table business_settings si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Assigner les paramètres existants au premier utilisateur créé
    UPDATE business_settings 
    SET user_id = (
      SELECT id FROM users ORDER BY created_at ASC LIMIT 1
    )
    WHERE user_id IS NULL;
    
    -- Rendre la colonne obligatoire après migration
    ALTER TABLE business_settings ALTER COLUMN user_id SET NOT NULL;
    
    -- Créer un index pour les performances
    CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);
  END IF;
END $$;

-- Fonction pour vérifier si un utilisateur peut accéder aux données d'un compte
CREATE OR REPLACE FUNCTION can_access_account_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  is_super_admin boolean;
  main_user_id uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Si c'est le même utilisateur, autoriser
  IF current_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'utilisateur actuel est super admin
  SELECT is_super_admin INTO is_super_admin
  FROM users 
  WHERE id = current_user_id;
  
  IF is_super_admin = true THEN
    RETURN true;
  END IF;
  
  -- Récupérer l'ID du compte principal (premier utilisateur créé)
  SELECT id INTO main_user_id
  FROM users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- Si l'utilisateur cible est le compte principal et que l'utilisateur actuel 
  -- a été créé via l'admin, autoriser l'accès
  IF target_user_id = main_user_id THEN
    -- Vérifier si l'utilisateur actuel a des rôles assignés (créé via admin)
    IF EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = current_user_id
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Mettre à jour les politiques RLS pour les services
DROP POLICY IF EXISTS "Authenticated users can view all services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update all services" ON services;
DROP POLICY IF EXISTS "Authenticated users can delete all services" ON services;

CREATE POLICY "Users can view accessible services"
  ON services
  FOR SELECT
  TO authenticated
  USING (can_access_account_data(user_id));

CREATE POLICY "Users can insert services to their account"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    can_access_account_data(user_id)
  );

CREATE POLICY "Users can update accessible services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (can_access_account_data(user_id))
  WITH CHECK (can_access_account_data(user_id));

CREATE POLICY "Users can delete accessible services"
  ON services
  FOR DELETE
  TO authenticated
  USING (can_access_account_data(user_id));

-- Mettre à jour les politiques RLS pour les clients
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update all clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete all clients" ON clients;

CREATE POLICY "Users can view accessible clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (can_access_account_data(user_id));

CREATE POLICY "Users can insert clients to their account"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    can_access_account_data(user_id)
  );

CREATE POLICY "Users can update accessible clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (can_access_account_data(user_id))
  WITH CHECK (can_access_account_data(user_id));

CREATE POLICY "Users can delete accessible clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (can_access_account_data(user_id));

-- Mettre à jour les politiques RLS pour les paramètres business
DROP POLICY IF EXISTS "Authenticated users can view business settings" ON business_settings;
DROP POLICY IF EXISTS "Authenticated users can update business settings" ON business_settings;

CREATE POLICY "Users can view accessible business settings"
  ON business_settings
  FOR SELECT
  TO authenticated
  USING (can_access_account_data(user_id));

CREATE POLICY "Users can update accessible business settings"
  ON business_settings
  FOR UPDATE
  TO authenticated
  USING (can_access_account_data(user_id))
  WITH CHECK (can_access_account_data(user_id));

-- Mettre à jour les politiques RLS pour les réservations
DROP POLICY IF EXISTS "Authenticated users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can delete all bookings" ON bookings;

CREATE POLICY "Users can view accessible bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    can_access_account_data(user_id) OR 
    assigned_user_id = auth.uid()
  );

CREATE POLICY "Users can insert bookings to their account"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    can_access_account_data(user_id)
  );

CREATE POLICY "Users can update accessible bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    can_access_account_data(user_id) OR 
    assigned_user_id = auth.uid()
  )
  WITH CHECK (
    can_access_account_data(user_id) OR 
    assigned_user_id = auth.uid()
  );

CREATE POLICY "Users can delete accessible bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    can_access_account_data(user_id) OR 
    assigned_user_id = auth.uid()
  );
