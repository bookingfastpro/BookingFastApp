/*
  # Migration 12: Database Functions and Triggers
  
  ## Overview
  Utility functions, triggers for automatic updates, and business logic
  
  ## Functions Created
  1. **update_updated_at_column()** - Auto-update updated_at timestamp
  2. **create_profile_for_user()** - Auto-create profile on user signup
  3. **track_booking_changes()** - Track booking modifications to history
  4. **notify_booking_event()** - Send notifications on booking events
  
  ## Triggers Created
  - updated_at triggers on all tables with updated_at column
  - profile creation trigger on auth.users
  - booking history tracking triggers
  - notification triggers
  
  ## Notes
  - Triggers fire automatically on database events
  - Functions can also be called manually
*/

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp';

-- ============================================================================
-- PROFILE MANAGEMENT
-- ============================================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_profile_for_user() IS 'Creates a profile entry when a new user signs up';

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- ============================================================================
-- BOOKING HISTORY TRACKING
-- ============================================================================

-- Function to track booking changes
CREATE OR REPLACE FUNCTION track_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
  change_data jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    change_data := jsonb_build_object(
      'operation', 'created',
      'new_values', to_jsonb(NEW)
    );
    
    INSERT INTO booking_history (booking_id, action, changes)
    VALUES (NEW.id, 'created', change_data);
    
  ELSIF TG_OP = 'UPDATE' THEN
    change_data := jsonb_build_object(
      'operation', 'updated',
      'old_values', to_jsonb(OLD),
      'new_values', to_jsonb(NEW)
    );
    
    INSERT INTO booking_history (booking_id, action, changes)
    VALUES (NEW.id, 'updated', change_data);
    
  ELSIF TG_OP = 'DELETE' THEN
    change_data := jsonb_build_object(
      'operation', 'deleted',
      'old_values', to_jsonb(OLD)
    );
    
    INSERT INTO booking_history (booking_id, action, changes)
    VALUES (OLD.id, 'deleted', change_data);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_booking_changes() IS 'Tracks all booking modifications to history table';

-- Trigger for booking history
DROP TRIGGER IF EXISTS track_booking_changes_trigger ON bookings;
CREATE TRIGGER track_booking_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION track_booking_changes();

-- ============================================================================
-- NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to create notification on booking events
CREATE OR REPLACE FUNCTION notify_booking_event()
RETURNS TRIGGER AS $$
DECLARE
  notification_title text;
  notification_message text;
  notification_type text := 'booking';
BEGIN
  IF TG_OP = 'INSERT' THEN
    notification_title := 'Nouvelle réservation';
    notification_message := 'Une nouvelle réservation a été créée pour ' || NEW.client_firstname || ' ' || NEW.client_name;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.payment_status != NEW.payment_status AND NEW.payment_status = 'completed' THEN
      notification_title := 'Paiement reçu';
      notification_message := 'Le paiement de ' || NEW.client_firstname || ' ' || NEW.client_name || ' a été reçu';
      notification_type := 'payment';
    ELSE
      notification_title := 'Réservation modifiée';
      notification_message := 'La réservation de ' || NEW.client_firstname || ' ' || NEW.client_name || ' a été modifiée';
    END IF;
  END IF;
  
  -- Create notification for assigned user
  IF NEW.assigned_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.assigned_user_id,
      notification_type,
      notification_title,
      notification_message,
      jsonb_build_object('booking_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_booking_event() IS 'Creates notifications for booking events';

-- Trigger for booking notifications
DROP TRIGGER IF EXISTS notify_booking_event_trigger ON bookings;
CREATE TRIGGER notify_booking_event_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_event();

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  tbl_name text;
  tables_list text[] := ARRAY[
    'profiles', 'teams', 'team_members', 'team_invitations',
    'services', 'service_categories', 'clients', 'bookings',
    'business_settings', 'google_calendar_tokens', 'unavailabilities',
    'blocked_date_ranges', 'company_info', 'products', 'invoices',
    'invoice_items', 'invoice_payments', 'subscription_plans',
    'subscriptions', 'stripe_customers', 'stripe_subscriptions',
    'plugins', 'plugin_subscriptions', 'team_member_plugin_permissions',
    'pos_settings', 'pos_categories', 'pos_products', 'pos_transactions',
    'payment_links', 'email_workflows', 'email_templates',
    'sms_workflows', 'sms_templates', 'affiliates', 'affiliate_settings',
    'multi_user_settings', 'platform_settings'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY tables_list
  LOOP
    -- Check if table has updated_at column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE information_schema.columns.table_name = tbl_name 
        AND information_schema.columns.column_name = 'updated_at'
    ) THEN
      -- Drop trigger if exists
      EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', tbl_name, tbl_name);
      
      -- Create trigger
      EXECUTE format(
        'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        tbl_name, tbl_name
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- UTILITY FUNCTIONS FOR APPLICATION
-- ============================================================================

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_active_subscription(uuid) IS 'Checks if user has an active subscription';

-- Function to check if user has access to plugin
CREATE OR REPLACE FUNCTION user_has_plugin_access(user_uuid uuid, plugin_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM plugin_subscriptions
    WHERE user_id = user_uuid
      AND plugin_id = plugin_uuid
      AND status IN ('active', 'grace_period')
      AND (current_period_end IS NULL OR current_period_end > now() OR grace_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_plugin_access(uuid, uuid) IS 'Checks if user has access to a specific plugin';

-- Function to get user's active plugins
CREATE OR REPLACE FUNCTION get_user_active_plugins(user_uuid uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  expires_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    ps.current_period_end
  FROM plugins p
  JOIN plugin_subscriptions ps ON ps.plugin_id = p.id
  WHERE ps.user_id = user_uuid
    AND ps.status IN ('active', 'grace_period')
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now() OR ps.grace_period_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_active_plugins(uuid) IS 'Returns list of active plugins for a user';