/*
  # Synchronisation abonnements SuperAdmin avec plugin_subscriptions ET subscription plan
  
  1. Fonction pour créer les abonnements plugins + plan Pro automatiquement
  2. Trigger sur users.subscription_status
  3. Backfill des abonnements existants
*/

-- 1. Fonction pour synchroniser l'abonnement avec tous les plugins ET le plan
CREATE OR REPLACE FUNCTION sync_user_subscription_to_plugins()
RETURNS TRIGGER AS $$
DECLARE
  v_plugin RECORD;
  v_pro_plan_id uuid;
  v_period_end timestamptz;
BEGIN
  -- Si le statut passe à 'active' ou 'trial'
  IF NEW.subscription_status IN ('active', 'trial') AND 
     (OLD.subscription_status IS NULL OR OLD.subscription_status NOT IN ('active', 'trial')) THEN
    
    RAISE NOTICE '🔄 Synchronisation abonnement pour user: %', NEW.id;
    
    -- Récupérer le plan Pro
    SELECT id INTO v_pro_plan_id
    FROM subscription_plans
    WHERE plan_id = 'monthly' OR LOWER(name) LIKE '%pro%'
    ORDER BY price_monthly DESC
    LIMIT 1;
    
    IF v_pro_plan_id IS NULL THEN
      RAISE WARNING '⚠️ Plan Pro non trouvé !';
    ELSE
      RAISE NOTICE '📦 Plan Pro trouvé: %', v_pro_plan_id;
      
      -- Calculer la date de fin (30 jours par défaut pour monthly)
      v_period_end := now() + interval '30 days';
      
      -- Créer ou mettre à jour l'abonnement au plan Pro
      INSERT INTO subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end
      ) VALUES (
        NEW.id,
        v_pro_plan_id,
        NEW.subscription_status,
        now(),
        v_period_end
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        plan_id = v_pro_plan_id,
        status = NEW.subscription_status,
        current_period_end = v_period_end,
        updated_at = now();
      
      RAISE NOTICE '✅ Plan Pro assigné à user %', NEW.id;
    END IF;
    
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
    
    -- Mettre à jour le plan Pro
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
  v_pro_plan_id uuid;
  v_period_end timestamptz;
  v_synced_count INTEGER := 0;
  v_plan_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Début du backfill des abonnements existants...';
  
  -- Récupérer le plan Pro
  SELECT id INTO v_pro_plan_id
  FROM subscription_plans
  WHERE plan_id = 'monthly' OR LOWER(name) LIKE '%pro%'
  ORDER BY price_monthly DESC
  LIMIT 1;
  
  IF v_pro_plan_id IS NULL THEN
    RAISE WARNING '⚠️ Plan Pro non trouvé pour le backfill !';
  ELSE
    RAISE NOTICE '📦 Plan Pro trouvé pour backfill: %', v_pro_plan_id;
  END IF;
  
  -- Calculer la date de fin (30 jours)
  v_period_end := now() + interval '30 days';
  
  -- Pour chaque utilisateur avec un abonnement actif ou trial
  -- ON NE SÉLECTIONNE QUE LES COLONNES QUI EXISTENT
  FOR v_user IN 
    SELECT id, subscription_status
    FROM users
    WHERE subscription_status IN ('active', 'trial')
  LOOP
    RAISE NOTICE '👤 Traitement user: %', v_user.id;
    
    -- Assigner le plan Pro si disponible
    IF v_pro_plan_id IS NOT NULL THEN
      INSERT INTO subscriptions (
        user_id,
        plan_id,
        status,
        current_period_start,
        current_period_end
      ) VALUES (
        v_user.id,
        v_pro_plan_id,
        v_user.subscription_status,
        now(),
        v_period_end
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        plan_id = v_pro_plan_id,
        status = v_user.subscription_status,
        current_period_end = v_period_end,
        updated_at = now();
      
      v_plan_count := v_plan_count + 1;
      RAISE NOTICE '  ✅ Plan Pro assigné';
    END IF;
    
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
  RAISE NOTICE '   - % plans Pro assignés', v_plan_count;
  RAISE NOTICE '   - % abonnements plugins créés', v_synced_count;
END $$;

-- 4. Vérification pour l'utilisateur spécifique
DO $$
DECLARE
  user_id_to_check uuid := '90c1d12b-4f6b-4941-a254-7fef8acb44a5';
  plugin_count INTEGER;
  user_status TEXT;
  has_plan BOOLEAN;
  plan_name TEXT;
BEGIN
  -- Récupérer le statut de l'utilisateur
  SELECT subscription_status INTO user_status
  FROM users
  WHERE id = user_id_to_check;
  
  -- Vérifier si l'utilisateur a un plan et récupérer son nom
  SELECT EXISTS(
    SELECT 1 FROM subscriptions WHERE user_id = user_id_to_check
  ) INTO has_plan;
  
  SELECT sp.name INTO plan_name
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = user_id_to_check;
  
  -- Compter les abonnements plugins
  SELECT COUNT(*) INTO plugin_count
  FROM plugin_subscriptions
  WHERE user_id = user_id_to_check;
  
  RAISE NOTICE '📊 Vérification pour user %:', user_id_to_check;
  RAISE NOTICE '   - Statut dans users: %', user_status;
  RAISE NOTICE '   - A un plan Pro: %', has_plan;
  RAISE NOTICE '   - Nom du plan: %', COALESCE(plan_name, 'AUCUN');
  RAISE NOTICE '   - Abonnements plugins: %', plugin_count;
  
  IF NOT has_plan AND user_status IN ('active', 'trial') THEN
    RAISE WARNING '⚠️ Utilisateur a un statut % mais pas de plan Pro !', user_status;
  END IF;
  
  IF plugin_count = 0 AND user_status IN ('active', 'trial') THEN
    RAISE WARNING '⚠️ Utilisateur a un statut % mais 0 abonnements plugins !', user_status;
  END IF;
  
  IF has_plan AND plugin_count > 0 THEN
    RAISE NOTICE '✅ Synchronisation complète OK';
  END IF;
END $$;
