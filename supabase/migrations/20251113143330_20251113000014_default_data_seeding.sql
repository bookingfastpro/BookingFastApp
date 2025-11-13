/*
  # Migration 14: Default Data Seeding
  
  ## Overview
  Insert default data for initial application setup
  
  ## Data Inserted
  1. **business_settings** - Default business configuration
  2. **subscription_plans** - Free, Pro, and Enterprise plans
  3. **plugins** - Available plugins (SMS, Email, POS, etc.)
  4. **app_versions** - Current application version
  5. **platform_settings** - Platform-wide settings
  6. **services** - Example services
  
  ## Notes
  - Uses conditional checks to avoid duplicate entries
  - All data is optional and can be modified later
  - Provides a good starting point for new installations
*/

-- ============================================================================
-- DEFAULT BUSINESS SETTINGS
-- ============================================================================

INSERT INTO business_settings (
  business_name,
  primary_color,
  secondary_color,
  opening_hours,
  buffer_minutes,
  default_deposit_percentage,
  multiply_deposit_by_participants,
  email_notifications,
  tax_rate
)
SELECT
  'BookingFast',
  '#3B82F6',
  '#8B5CF6',
  '{
    "monday": {"start": "08:00", "end": "18:00", "closed": false},
    "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
    "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
    "thursday": {"start": "08:00", "end": "18:00", "closed": false},
    "friday": {"start": "08:00", "end": "18:00", "closed": false},
    "saturday": {"start": "09:00", "end": "17:00", "closed": false},
    "sunday": {"start": "09:00", "end": "17:00", "closed": true}
  }'::jsonb,
  15,
  30,
  false,
  true,
  20.00
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, is_active, max_team_members, max_bookings_per_month)
VALUES
  (
    'Free',
    'Perfect for getting started',
    0.00,
    0.00,
    '["Up to 50 bookings/month", "1 team member", "Basic support", "Email notifications"]'::jsonb,
    true,
    1,
    50
  ),
  (
    'Pro',
    'For growing businesses',
    29.99,
    299.90,
    '["Unlimited bookings", "Up to 5 team members", "Priority support", "SMS notifications", "Advanced analytics", "Custom branding"]'::jsonb,
    true,
    5,
    NULL
  ),
  (
    'Enterprise',
    'For large organizations',
    99.99,
    999.90,
    '["Unlimited everything", "Unlimited team members", "24/7 support", "API access", "Custom integrations", "Dedicated account manager"]'::jsonb,
    true,
    NULL,
    NULL
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PLUGINS
-- ============================================================================

INSERT INTO plugins (name, description, icon, price_monthly, is_active, features, category, display_order)
VALUES
  (
    'SMS Notifications',
    'Send automated SMS notifications to customers',
    'MessageSquare',
    9.99,
    true,
    '["Automated SMS workflows", "Custom templates", "Twilio integration", "Delivery tracking"]'::jsonb,
    'communication',
    1
  ),
  (
    'Email Automation',
    'Advanced email workflow automation',
    'Mail',
    4.99,
    true,
    '["Email workflows", "Custom templates", "Brevo integration", "Analytics"]'::jsonb,
    'communication',
    2
  ),
  (
    'Point of Sale',
    'Complete POS system for in-person sales',
    'ShoppingCart',
    19.99,
    true,
    '["Product catalog", "Transaction history", "Inventory management", "Receipt printing"]'::jsonb,
    'sales',
    3
  ),
  (
    'Advanced Analytics',
    'Detailed business analytics and reporting',
    'BarChart3',
    14.99,
    true,
    '["Revenue reports", "Customer insights", "Booking trends", "Export to Excel"]'::jsonb,
    'analytics',
    4
  ),
  (
    'Google Calendar Sync',
    'Two-way sync with Google Calendar',
    'Calendar',
    7.99,
    true,
    '["Automatic sync", "Two-way updates", "Multiple calendars", "Conflict detection"]'::jsonb,
    'integration',
    5
  ),
  (
    'Affiliate Program',
    'Manage and track affiliate referrals',
    'Users',
    12.99,
    true,
    '["Referral tracking", "Commission management", "Affiliate dashboard", "Payout automation"]'::jsonb,
    'marketing',
    6
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- APP VERSION
-- ============================================================================

INSERT INTO app_versions (version_number, release_date, features, is_current)
VALUES (
  '2.0.0',
  CURRENT_DATE,
  '[
    "Complete database redesign",
    "Improved performance",
    "Enhanced security",
    "Better plugin system",
    "Modern UI updates"
  ]'::jsonb,
  true
)
ON CONFLICT (version_number) DO NOTHING;

-- ============================================================================
-- PLATFORM SETTINGS
-- ============================================================================

INSERT INTO platform_settings (setting_key, setting_value, is_public, description)
VALUES
  (
    'maintenance_mode',
    '{"enabled": false, "message": ""}'::jsonb,
    false,
    'Platform maintenance mode configuration'
  ),
  (
    'feature_flags',
    '{
      "sms_enabled": true,
      "email_enabled": true,
      "pos_enabled": true,
      "affiliate_enabled": true,
      "google_calendar_enabled": true
    }'::jsonb,
    false,
    'Feature availability flags'
  ),
  (
    'default_currency',
    '{"code": "EUR", "symbol": "€"}'::jsonb,
    true,
    'Default currency for the platform'
  ),
  (
    'supported_languages',
    '["fr", "en"]'::jsonb,
    true,
    'Supported languages'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- EXAMPLE SERVICES
-- ============================================================================

INSERT INTO services (name, price_ht, price_ttc, description, duration_minutes, capacity, category, is_active)
SELECT 'Consultation Standard', 50.00, 60.00, 'Consultation de base avec diagnostic complet', 60, 1, 'Consultations', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Consultation Standard');

INSERT INTO services (name, price_ht, price_ttc, description, duration_minutes, capacity, category, is_active)
SELECT 'Séance Premium', 83.33, 100.00, 'Séance approfondie avec suivi personnalisé', 90, 1, 'Consultations', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Séance Premium');

INSERT INTO services (name, price_ht, price_ttc, description, duration_minutes, capacity, category, is_active)
SELECT 'Atelier Groupe', 41.67, 50.00, 'Session collective pour plusieurs participants', 120, 6, 'Ateliers', true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Atelier Groupe');

-- ============================================================================
-- AFFILIATE SETTINGS
-- ============================================================================

INSERT INTO affiliate_settings (is_affiliate_enabled, default_commission_rate, payment_threshold)
SELECT true, 10.00, 50.00
WHERE NOT EXISTS (SELECT 1 FROM affiliate_settings LIMIT 1);

-- ============================================================================
-- POS SETTINGS
-- ============================================================================

INSERT INTO pos_settings (tax_rate, receipt_header, receipt_footer, auto_print_receipt)
SELECT 20.00, 'Merci pour votre visite!', 'À bientôt!', false
WHERE NOT EXISTS (SELECT 1 FROM pos_settings LIMIT 1);