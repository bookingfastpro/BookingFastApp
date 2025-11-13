/*
  # Add replaced_by tracking to payment_links

  1. Changes
    - Add `replaced_by_transaction_id` column to track when payment link is replaced by actual payment
    - Add index for performance
    
  2. Purpose
    - When payment link is paid, mark it as replaced
    - Payment history will filter out replaced links
*/

-- Add replaced_by_transaction_id column
ALTER TABLE payment_links 
ADD COLUMN IF NOT EXISTS replaced_by_transaction_id uuid;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_payment_links_replaced_by 
ON payment_links(replaced_by_transaction_id) 
WHERE replaced_by_transaction_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN payment_links.replaced_by_transaction_id IS 
'ID of the transaction that replaced this payment link (when paid)';
