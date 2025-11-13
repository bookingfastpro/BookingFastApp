/*
  # Fix has_plugin_access function
  
  ## Problem
  Function references p.slug column which doesn't exist in plugins table
  
  ## Solution
  Update function to use p.name instead since plugins use name as identifier
  Also add slug column to plugins table for future use
*/

-- ============================================================================
-- Add slug column to plugins table for future use
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plugins' AND column_name = 'slug'
  ) THEN
    ALTER TABLE plugins ADD COLUMN slug text;
    
    -- Create unique index on slug
    CREATE UNIQUE INDEX IF NOT EXISTS idx_plugins_slug ON plugins(slug);
  END IF;
END $$;

-- Populate slug from name for existing plugins
UPDATE plugins
SET slug = lower(replace(name, ' ', '-'))
WHERE slug IS NULL;

-- ============================================================================
-- Recreate has_plugin_access function to use name as fallback
-- ============================================================================

CREATE OR REPLACE FUNCTION has_plugin_access(p_user_id uuid, p_plugin_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    WHERE ps.user_id = p_user_id
      AND (
        p.slug = p_plugin_slug 
        OR lower(replace(p.name, ' ', '-')) = p_plugin_slug
        OR p.name = p_plugin_slug
      )
      AND ps.status IN ('active', 'trial')
      AND (
        ps.current_period_end IS NULL 
        OR ps.current_period_end > now()
        OR (ps.grace_period_end IS NOT NULL AND ps.grace_period_end > now())
      )
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION has_plugin_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION has_plugin_access(uuid, text) TO anon;
