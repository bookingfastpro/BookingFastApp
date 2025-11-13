/*
  # Create generate_quote_number Function
  
  ## Problem
  The code calls generate_quote_number() but the function doesn't exist.
  
  ## Solution
  Create the generate_quote_number() function similar to generate_invoice_number().
  
  ## Changes
  1. Create generate_quote_number() function
  2. Returns format: D{YEAR}-{NUMBER}
*/

-- Create generate_quote_number function
CREATE OR REPLACE FUNCTION generate_quote_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
  year_str text;
  quote_number text;
BEGIN
  -- Get current year
  year_str := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get the next quote number for this user and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN quote_number ~ ('^D' || year_str || '-[0-9]+$')
      THEN substring(quote_number from '[0-9]+$')::integer
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE user_id = p_user_id
    AND document_type = 'quote'
    AND quote_number IS NOT NULL;
  
  -- Format: D{YEAR}-{NUMBER} (e.g., D2025-0001)
  quote_number := 'D' || year_str || '-' || lpad(next_number::text, 4, '0');
  
  RETURN quote_number;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_quote_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number(uuid) TO anon;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
