/*
  # Update opening hours structure to support multiple time ranges

  1. Database Changes
    - Update business_settings.opening_hours to support ranges array
    - Update services.availability_hours to support ranges array
    - Migrate existing data to new format

  2. Data Migration
    - Convert existing start/end format to ranges array format
    - Preserve all existing data
    - Ensure backward compatibility

  3. Security
    - No changes to RLS policies
    - Maintain existing permissions
*/

-- Function to migrate opening hours format
CREATE OR REPLACE FUNCTION migrate_opening_hours_format()
RETURNS void AS $$
DECLARE
  rec RECORD;
  day_name TEXT;
  day_data JSONB;
  new_opening_hours JSONB := '{}';
BEGIN
  -- Migrate business_settings opening_hours
  FOR rec IN SELECT id, opening_hours FROM business_settings WHERE opening_hours IS NOT NULL LOOP
    new_opening_hours := '{}';
    
    FOR day_name IN SELECT * FROM jsonb_object_keys(rec.opening_hours) LOOP
      day_data := rec.opening_hours->day_name;
      
      -- Check if already in new format (has 'ranges' key)
      IF day_data ? 'ranges' THEN
        new_opening_hours := new_opening_hours || jsonb_build_object(day_name, day_data);
      ELSE
        -- Convert old format to new format
        new_opening_hours := new_opening_hours || jsonb_build_object(
          day_name,
          jsonb_build_object(
            'ranges', jsonb_build_array(
              jsonb_build_object(
                'start', COALESCE(day_data->>'start', '08:00'),
                'end', COALESCE(day_data->>'end', '18:00')
              )
            ),
            'closed', COALESCE((day_data->>'closed')::boolean, false)
          )
        );
      END IF;
    END LOOP;
    
    -- Update the record
    UPDATE business_settings 
    SET opening_hours = new_opening_hours,
        updated_at = now()
    WHERE id = rec.id;
  END LOOP;

  -- Migrate services availability_hours
  FOR rec IN SELECT id, availability_hours FROM services WHERE availability_hours IS NOT NULL LOOP
    new_opening_hours := '{}';
    
    FOR day_name IN SELECT * FROM jsonb_object_keys(rec.availability_hours) LOOP
      day_data := rec.availability_hours->day_name;
      
      -- Check if already in new format (has 'ranges' key)
      IF day_data ? 'ranges' THEN
        new_opening_hours := new_opening_hours || jsonb_build_object(day_name, day_data);
      ELSE
        -- Convert old format to new format
        new_opening_hours := new_opening_hours || jsonb_build_object(
          day_name,
          jsonb_build_object(
            'ranges', jsonb_build_array(
              jsonb_build_object(
                'start', COALESCE(day_data->>'start', '08:00'),
                'end', COALESCE(day_data->>'end', '18:00')
              )
            ),
            'closed', COALESCE((day_data->>'closed')::boolean, false)
          )
        );
      END IF;
    END LOOP;
    
    -- Update the record
    UPDATE services 
    SET availability_hours = new_opening_hours,
        updated_at = now()
    WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_opening_hours_format();

-- Drop the migration function
DROP FUNCTION migrate_opening_hours_format();
