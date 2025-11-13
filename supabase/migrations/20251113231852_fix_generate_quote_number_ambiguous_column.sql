/*
  # Fix generate_quote_number ambiguous column reference
  
  ## Problem
  Column reference "quote_number" is ambiguous - it could refer to:
  - The PL/pgSQL variable quote_number
  - The table column invoices.quote_number
  
  ## Solution
  Qualify the column reference with the table name: invoices.quote_number
*/

DROP FUNCTION IF EXISTS generate_quote_number(uuid);

CREATE OR REPLACE FUNCTION generate_quote_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
  year_str text;
  result_quote_number text;
BEGIN
  -- Get current year
  year_str := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get the next quote number for this user and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoices.quote_number ~ ('^D' || year_str || '-[0-9]+$')
      THEN substring(invoices.quote_number from '[0-9]+$')::integer
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoices.user_id = p_user_id
    AND invoices.document_type = 'quote'
    AND invoices.quote_number IS NOT NULL;
  
  -- Format: D{YEAR}-{NUMBER} (e.g., D2025-0001)
  result_quote_number := 'D' || year_str || '-' || lpad(next_number::text, 4, '0');
  
  RETURN result_quote_number;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_quote_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number(uuid) TO anon;
