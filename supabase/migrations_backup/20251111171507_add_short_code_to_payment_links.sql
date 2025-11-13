/*
  # Add short code to payment links
  
  1. Changes
    - Add `short_code` column to `payment_links` table
    - Add unique constraint on `short_code`
    - Add index for faster lookups
    
  2. Purpose
    - Enable short URLs for SMS compatibility
    - Format: domain.com/p/ABC123 instead of domain.com/payment?link_id=uuid
*/

-- Add short_code column
ALTER TABLE payment_links 
ADD COLUMN IF NOT EXISTS short_code text;

-- Add unique constraint
ALTER TABLE payment_links
DROP CONSTRAINT IF EXISTS payment_links_short_code_key;

ALTER TABLE payment_links
ADD CONSTRAINT payment_links_short_code_key UNIQUE (short_code);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_short_code 
ON payment_links(short_code);

-- Add comment
COMMENT ON COLUMN payment_links.short_code IS 'Short alphanumeric code for URL shortening (6-8 chars)';
