/*
  # Assigner le rôle propriétaire aux utilisateurs existants

  1. Mise à jour
    - Assigne le rôle "owner" à tous les utilisateurs existants
    - Garantit que les utilisateurs actuels ont tous les droits
  
  2. Sécurité
    - Utilise une fonction pour assigner automatiquement le rôle propriétaire
    - Mise à jour du trigger pour les nouveaux utilisateurs
*/

-- Fonction pour assigner le rôle propriétaire par défaut
CREATE OR REPLACE FUNCTION assign_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si c'est le premier utilisateur ou si aucun propriétaire n'existe
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.id = 'owner'
  ) THEN
    -- Premier utilisateur = propriétaire automatique
    INSERT INTO user_roles (user_id, role_id, granted_by)
    VALUES (NEW.id, 'owner', NEW.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  ELSE
    -- Utilisateurs suivants = rôle par défaut (employee)
    INSERT INTO user_roles (user_id, role_id, granted_by)
    VALUES (NEW.id, 'employee', NEW.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS assign_default_role_trigger ON users;

-- Créer le nouveau trigger
CREATE TRIGGER assign_owner_role_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_owner_role();

-- Assigner le rôle propriétaire à tous les utilisateurs existants qui n'ont pas de rôle
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Pour chaque utilisateur existant sans rôle
  FOR user_record IN 
    SELECT u.id 
    FROM users u 
    LEFT JOIN user_roles ur ON u.id = ur.user_id 
    WHERE ur.user_id IS NULL
  LOOP
    -- Assigner le rôle propriétaire
    INSERT INTO user_roles (user_id, role_id, granted_by)
    VALUES (user_record.id, 'owner', user_record.id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Rôle propriétaire assigné à l''utilisateur: %', user_record.id;
  END LOOP;
END $$;
