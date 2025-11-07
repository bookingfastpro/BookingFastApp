/*
  # Synchronisation abonnements SuperAdmin avec plugin_subscriptions
  
  1. Fonction pour créer les abonnements plugins automatiquement
  2. Trigger sur users.subscription_status
  3. Backfill des abonnements existants
  
  CORRECTION : Variables préfixées avec v_ pour éviter les conflits
*/

-- 1. Fonction pour synchroniser l'abonnement avec tous les plugins
CREATE OR REPLACE FUNCTION sync_user_subscription_to_plugins()
RETURNS TRIGGER AS $$
DECLARE
  v_plugin RECORD;
  v_period_end timestamptz;
BEGIN
  -- Si le statut passe à 'active' ou 'trial'
  IF NEW.subscription_status IN ('active', 'trial') AND 
     (OLD.subscription_status IS NULL OR OLD.subscription_status NOT IN ('active', 'trial')) THEN
    
    RAISE NOTICE '🔄 Synchronisation abonnement pour user: %', NEW.id;
    
    -- Calculer la date de fin (30 jours par défaut)
    v_period_end := now() + interval '30 days';
    
    -- Créer ou mettre à jour l'abonnement principal (sans plan_id)
    INSERT INTO subscriptions (
      user_id,
      status,
      is_trial,
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      NEW.id,
      NEW.subscription_status,
      CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
      CASE WHEN NEW.subscription_status = 'trial' THEN v_period_end ELSE NULL END,
      now(),
      v_period_end
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      status = NEW.subscription_status,
      is_trial = CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
      trial_ends_at = CASE WHEN NEW.subscription_status = 'trial' THEN v_period_end ELSE NULL END,
      current_period_end = v_period_end,
      updated_at = now();
    
    RAISE NOTICE '✅ Abonnement principal mis à jour pour user %', NEW.id;
    
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
          trial_used,
          current_period_start,
          current_period_end
        ) VALUES (
          NEW.id,
          v_plugin.id,
          NEW.subscription_status,
          CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
          CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
          now(),
          v_period_end
        );
        
        RAISE NOTICE '✅ Plugin % ajouté pour user %', v_plugin.name, NEW.id;
      ELSE
        -- Mettre à jour l'abonnement existant
        UPDATE plugin_subscriptions
        SET 
          status = NEW.subscription_status,
          is_trial = CASE WHEN NEW.subscription_status = 'trial' THEN true ELSE false END,
          current_period_end = v_period_end,
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
    
    -- Mettre à jour l'abonnement principal
    UPDATE subscriptions
    SET 
      status = NEW.subscription_status,
      updated_at = now()
    WHERE user_id = NEW.id
    AND status IN ('active', 'trial');
    
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
  v_period_end timestamptz;
  v_synced_count INTEGER := 0;
  v_main_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Début du backfill des abonnements existants...';
  
  -- Calculer la date de fin (30 jours)
  v_period_end := now() + interval '30 days';
  
  -- Pour chaque utilisateur avec un abonnement actif ou trial
  FOR v_user IN 
    SELECT id, subscription_status
    FROM users
    WHERE subscription_status IN ('active', 'trial')
  LOOP
    RAISE NOTICE '👤 Traitement user: %', v_user.id;
    
    -- Créer ou mettre à jour l'abonnement principal
    INSERT INTO subscriptions (
      user_id,
      status,
      is_trial,
      trial_ends_at,
      current_period_start,
      current_period_end
    ) VALUES (
      v_user.id,
      v_user.subscription_status,
      CASE WHEN v_user.subscription_status = 'trial' THEN true ELSE false END,
      CASE WHEN v_user.subscription_status = 'trial' THEN v_period_end ELSE NULL END,
      now(),
      v_period_end
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      status = v_user.subscription_status,
      is_trial = CASE WHEN v_user.subscription_status = 'trial' THEN true ELSE false END,
      trial_ends_at = CASE WHEN v_user.subscription_status = 'trial' THEN v_period_end ELSE NULL END,
      current_period_end = v_period_end,
      updated_at = now();
    
    v_main_count := v_main_count + 1;
    RAISE NOTICE '  ✅ Abonnement principal créé/mis à jour';
    
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
          trial_used,
          current_period_start,
          current_period_end
        ) VALUES (
          v_user.id,
          v_plugin.id,
          v_user.subscription_status,
          CASE WHEN v_user.subscription_status = 'trial' THEN true ELSE false END,
          CASE WHEN v_user.subscription_status = 'trial' THEN true ELSE false END,
          now(),
          v_period_end
        );
        
        v_synced_count := v_synced_count + 1;
        RAISE NOTICE '  ✅ Plugin % ajouté', v_plugin.name;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill terminé:';
  RAISE NOTICE '   - % abonnements principaux créés/mis à jour', v_main_count;
  RAISE NOTICE '   - % abonnements plugins créés', v_synced_count;
END $$;

-- 4. Vérification pour l'utilisateur spécifique
DO $$
DECLARE
  v_user_id uuid := '90c1d12b-4f6b-4941-a254-7fef8acb44a5';
  v_plugin_count INTEGER;
  v_user_status TEXT;
  v_has_subscription BOOLEAN;
  v_subscription_status TEXT;
BEGIN
  -- Récupérer le statut de l'utilisateur
  SELECT users.subscription_status INTO v_user_status
  FROM users
  WHERE users.id = v_user_id;
  
  -- Vérifier si l'utilisateur a un abonnement principal
  SELECT EXISTS(
    SELECT 1 FROM subscriptions WHERE user_id = v_user_id
  ) INTO v_has_subscription;
  
  SELECT status INTO v_subscription_status
  FROM subscriptions
  WHERE user_id = v_user_id;
  
  -- Compter les abonnements plugins
  SELECT COUNT(*) INTO v_plugin_count
  FROM plugin_subscriptions
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Vérification pour user %:', v_user_id;
  RAISE NOTICE '   - Statut dans users: %', v_user_status;
  RAISE NOTICE '   - A un abonnement principal: %', v_has_subscription;
  RAISE NOTICE '   - Statut abonnement: %', COALESCE(v_subscription_status, 'AUCUN');
  RAISE NOTICE '   - Abonnements plugins: %', v_plugin_count;
  
  IF NOT v_has_subscription AND v_user_status IN ('active', 'trial') THEN
    RAISE WARNING '⚠️ Utilisateur a un statut % mais pas d''abonnement principal !', v_user_status;
  END IF;
  
  IF v_plugin_count = 0 AND v_user_status IN ('active', 'trial') THEN
    RAISE WARNING '⚠️ Utilisateur a un statut % mais 0 abonnements plugins !', v_user_status;
  END IF;
  
  IF v_has_subscription AND v_plugin_count > 0 THEN
    RAISE NOTICE '✅ Synchronisation complète OK';
  END IF;
END $$;
