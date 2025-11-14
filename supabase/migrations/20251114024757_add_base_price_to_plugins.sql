/*
  # Add base_price column to plugins table

  1. Changes
    - Add `base_price` column to `plugins` table
    - Type: numeric (to store decimal prices)
    - Default: 0.00
    - Nullable: true (for backwards compatibility)

  2. Notes
    - This allows plugins to have a base price separate from monthly pricing
    - Existing plugins will have NULL base_price until updated
*/

-- Add base_price column to plugins table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plugins' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE plugins ADD COLUMN base_price numeric DEFAULT 0.00;
  END IF;
END $$;
