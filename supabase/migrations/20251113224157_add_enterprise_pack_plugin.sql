/*
  # Add Enterprise Pack Plugin
  
  1. New Plugin
    - `entreprisepack` - Increases team member limit from 10 to 50
    
  2. Features
    - Base limit: 10 members
    - With pack: 50 members
    - Price: 49.99€/month
  
  3. Helper Functions
    - get_team_member_limit() - Returns team member limit based on plugin
    - can_add_team_member() - Checks if owner can add more members
    - get_team_stats() - Returns team statistics
*/

-- Insert Enterprise Pack plugin
INSERT INTO plugins (
  name, 
  slug, 
  description, 
  icon, 
  category, 
  price_monthly, 
  features, 
  is_featured,
  is_active,
  display_order
) VALUES (
  'Pack Société',
  'entreprisepack',
  'Augmentez votre capacité d''équipe de 10 à 50 membres pour gérer une grande entreprise',
  'Building2',
  'management',
  49.99,
  '["50 membres d''équipe max", "Permissions avancées", "Analytiques d''équipe", "Support prioritaire"]'::jsonb,
  true,
  true,
  7
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

-- Function to get team member limit
CREATE OR REPLACE FUNCTION get_team_member_limit(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_has_enterprise_pack boolean;
BEGIN
  -- Check if user has active enterprise pack
  SELECT EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND p.slug = 'entreprisepack'
    AND ps.status IN ('active', 'trial')
    AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
  ) INTO v_has_enterprise_pack;

  -- Return limit based on pack
  IF v_has_enterprise_pack THEN
    RETURN 50;
  ELSE
    RETURN 10;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if owner can add team member
CREATE OR REPLACE FUNCTION can_add_team_member(p_owner_id uuid)
RETURNS boolean AS $$
DECLARE
  v_current_count integer;
  v_limit integer;
BEGIN
  -- Count current active members
  SELECT COUNT(*)
  INTO v_current_count
  FROM team_members
  WHERE owner_id = p_owner_id
  AND is_active = true;

  -- Get limit
  v_limit := get_team_member_limit(p_owner_id);

  -- Return if can add
  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats(p_owner_id uuid)
RETURNS TABLE (
  current_members integer,
  member_limit integer,
  available_slots integer,
  has_enterprise_pack boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM team_members WHERE owner_id = p_owner_id AND is_active = true),
    get_team_member_limit(p_owner_id),
    get_team_member_limit(p_owner_id) - (SELECT COUNT(*)::integer FROM team_members WHERE owner_id = p_owner_id AND is_active = true),
    EXISTS (
      SELECT 1
      FROM plugin_subscriptions ps
      JOIN plugins p ON p.id = ps.plugin_id
      WHERE ps.user_id = p_owner_id
      AND p.slug = 'entreprisepack'
      AND ps.status IN ('active', 'trial')
      AND (ps.current_period_end IS NULL OR ps.current_period_end > now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
