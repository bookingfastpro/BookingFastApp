/*
  # Add foreign key relationship between services and service_categories

  1. Database Changes
    - Add foreign key constraint from services.category_id to service_categories.id
    - This enables Supabase to recognize the relationship for implicit joins

  2. Security
    - No RLS changes needed as existing policies will handle access control
*/

-- Add foreign key constraint to establish relationship
ALTER TABLE services 
ADD CONSTRAINT fk_services_category_id 
FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
