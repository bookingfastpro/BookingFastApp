/*
  # Synchronisation abonnements SuperAdmin avec plugin_subscriptions
  
  1. Fonction pour créer les abonnements plugins automatiquement
  2. Trigger sur users.subscription_status
  3. Backfill des abonnements existants
*/

-- 1. Fonction pour synchroniser l'abonnement avec tous les plugins
CREATE OR REPLACE FUNCTION sync_user_subscription_to_plugins()
RETURNS TRIGGER AS $$
DECLARE
  v_plugin RECORD;
  v_plan_id uuid;
BEGIN
  -- Si le statut passe à 'active' ou 'trial'
  IF NEW.subscription_status IN ('active', 'trial') AND 
     (OLD.subscription_status IS NULL OR OLD.subscription_status NOT IN ('active', 'trial')) THEN
    
    RAISE NOTICE '🔄 Synchronisation abonnement pour user: %', NEW.id;
    
    -- Récupérer le plan_id basé sur le plan_type
    SELECT id INTO v_plan_id
    FROM subscription_plans
    WHERE LOWER(name) = LOWER(NEW.plan_type)
    LIMIT 1;
    
    -- Pour chaque plugin actif
    FOR v_plugin IN 
      SELECT id, slug, name 
      FROM plugins 
      WHERE is_active = true
    LOOP
      -- Vérifier si l'abonnement plugin existe déjà
      IF NOT EXISTS (
        SELECT 1 
        FROM plugin_subscriptions 
        WHERE user_id = NEW.id 
        AND plugin_id = v_plugin.id
      ) THEN
        -- Créer l'abonnement plugin
        INSERT INTO plugin_subscriptions (
          user_id,
          plugin_id,
          status,
          is_trial,
          trial_ends_at,
          trial_used,
          current_period_start,
          current_period_end
        ) VALUES (
          NEW.id,
          v_plugin.id,
          NEW.subscription_status,
          CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
          NEW.trial_ends_at,
          CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
          COALESCE(NEW.subscription_start, now()),
          NEW.subscription_end
        );
        
        RAISE NOTICE '✅ Plugin % ajouté pour user %', v_plugin.name, NEW.id;
      ELSE
        -- Mettre à jour l'abonnement existant
        UPDATE plugin_subscriptions
        SET 
          status = NEW.subscription_status,
          is_trial = CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
          trial_ends_at = NEW.trial_ends_at,
          current_period_start = COALESCE(NEW.subscription_start, current_period_start),
          current_period_end = NEW.subscription_end,
          updated_at = now()
        WHERE user_id = NEW.id 
        AND plugin_id = v_plugin.id;
        
        RAISE NOTICE '🔄 Plugin % mis à jour pour user %', v_plugin.name, NEW.id;
      END IF;
    END LOOP;
    
  -- Si le statut passe à 'expired' ou 'cancelled'
  ELSIF NEW.subscription_status IN ('expired', 'cancelled') AND 
        OLD.subscription_status IN ('active', 'trial') THEN
    
    RAISE NOTICE '❌ Désactivation abonnements pour user: %', NEW.id;
    
    -- Mettre à jour tous les abonnements plugins
    UPDATE plugin_subscriptions
    SET 
      status = NEW.subscription_status,
      updated_at = now()
    WHERE user_id = NEW.id
    AND status IN ('active', 'trial');
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger
DROP TRIGGER IF EXISTS sync_subscription_to_plugins ON users;

CREATE TRIGGER sync_subscription_to_plugins
  AFTER UPDATE OF subscription_status ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_subscription_to_plugins();

-- 3. Backfill: Synchroniser les abonnements existants
DO $$
DECLARE
  v_user RECORD;
  v_plugin RECORD;
  v_synced_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Début du backfill des abonnements existants...';
  
  -- Pour chaque utilisateur avec un abonnement actif ou trial
  FOR v_user IN 
    SELECT id, subscription_status, subscription_start, subscription_end, trial_ends_at, plan_type
    FROM users
    WHERE subscription_status IN ('active', 'trial')
  LOOP
    RAISE NOTICE '👤 Traitement user: %', v_user.id;
    
    -- Pour chaque plugin actif
    FOR v_plugin IN 
      SELECT id, name 
      FROM plugins 
      WHERE is_active = true
    LOOP
      -- Vérifier si l'abonnement plugin existe déjà
      IF NOT EXISTS (
        SELECT 1 
        FROM plugin_subscriptions 
        WHERE user_id = v_user.id 
        AND plugin_id = v_plugin.id
      ) THEN
        -- Créer l'abonnement plugin
        INSERT INTO plugin_subscriptions (
          user_id,
          plugin_id,
          status,
          is_trial,
          trial_ends_at,
          trial_used,
          current_period_start,
          current_period_end
        ) VALUES (
          v_user.id,
          v_plugin.id,
          v_user.subscription_status,
          CASE WHEN v_user.subscription_status = 'trial' THEN true ELSE false END,
          v_user.trial_ends_at,
          CASE WHEN v_user.subscription_status = 'trial' THEN true ELSE false END,
          COALESCE(v_user.subscription_start, now()),
          v_user.subscription_end
        );
        
        v_synced_count := v_synced_count + 1;
        RAISE NOTICE '  ✅ Plugin % ajouté', v_plugin.name;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill terminé: % abonnements plugins créés', v_synced_count;
END $$;

-- 4. Vérification pour l'utilisateur spécifique
DO $$
DECLARE
  user_id_to_check uuid := '90c1d12b-4f6b-4941-a254-7fef8acb44a5';
  sub_count INTEGER;
  user_status TEXT;
BEGIN
  -- Récupérer le statut de l'utilisateur
  SELECT subscription_status INTO user_status
  FROM users
  WHERE id = user_id_to_check;
  
  -- Compter les abonnements plugins
  SELECT COUNT(*) INTO sub_count
  FROM plugin_subscriptions
  WHERE user_id = user_id_to_check;
  
  RAISE NOTICE '📊 Vérification pour user %:', user_id_to_check;
  RAISE NOTICE '   - Statut dans users: %', user_status;
  RAISE NOTICE '   - Abonnements plugins: %', sub_count;
  
  IF sub_count = 0 AND user_status IN ('active', 'trial') THEN
    RAISE WARNING '⚠️ Utilisateur a un statut % mais 0 abonnements plugins !', user_status;
  ELSE
    RAISE NOTICE '✅ Synchronisation OK';
  END IF;
END $$;
